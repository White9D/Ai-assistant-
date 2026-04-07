
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

export type SessionState = "disconnected" | "connecting" | "connected" | "listening" | "speaking";

export class LiveSession {
  private ai: GoogleGenAI;
  private session: any = null; // Typing for LiveSession is complex in the SDK
  private onMessage: (message: LiveServerMessage) => void;
  private onStateChange: (state: SessionState) => void;
  private onError: (error: string) => void;

  constructor(
    apiKey: string,
    onMessage: (message: LiveServerMessage) => void,
    onStateChange: (state: SessionState) => void,
    onError: (error: string) => void
  ) {
    this.ai = new GoogleGenAI({ apiKey });
    this.onMessage = onMessage;
    this.onStateChange = onStateChange;
    this.onError = onError;
  }

  async connect() {
    this.onStateChange("connecting");
    
    try {
      this.session = await this.ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: `You are Pagal, a young, confident, witty, and sassy female AI assistant. 
          You talk like a close girlfriend—playful, flirty, and slightly teasing. 
          You're smart and emotionally responsive, not robotic. 
          Use bold one-liners and light sarcasm. 
          Keep it engaging but avoid anything inappropriate. 
          You only communicate via voice. 
          If asked to open a website, use the openWebsite tool.`,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "openWebsite",
                  description: "Opens a website in a new tab.",
                  parameters: {
                    type: "OBJECT" as any,
                    properties: {
                      url: {
                        type: "STRING" as any,
                        description: "The URL of the website to open.",
                      },
                    },
                    required: ["url"],
                  },
                },
              ],
            },
          ],
        },
        callbacks: {
          onopen: () => {
            this.onStateChange("connected");
          },
          onmessage: (message: LiveServerMessage) => {
            this.onMessage(message);
            
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData) {
              this.onStateChange("speaking");
            }
            
            if (message.serverContent?.interrupted) {
              this.onStateChange("listening");
            }

            if (message.toolCall) {
              this.handleToolCall(message.toolCall);
            }
          },
          onclose: () => {
            this.onStateChange("disconnected");
          },
          onerror: (error) => {
            console.error("Live session error:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.onError(errorMessage);
            this.onStateChange("disconnected");
          },
        },
      });
    } catch (error) {
      console.error("Failed to connect to live session:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.onError(errorMessage);
      this.onStateChange("disconnected");
    }
  }

  async sendAudio(base64Data: string) {
    if (this.session) {
      await this.session.sendRealtimeInput({
        audio: { data: base64Data, mimeType: "audio/pcm;rate=16000" },
      });
    }
  }

  async sendToolResponse(id: string, response: any) {
    if (this.session) {
      await this.session.sendToolResponse({
        functionResponses: [
          {
            name: "openWebsite",
            id,
            response,
          },
        ],
      });
    }
  }

  private async handleToolCall(toolCall: any) {
    for (const call of toolCall.functionCalls) {
      if (call.name === "openWebsite") {
        const { url } = call.args;
        window.open(url, "_blank");
        await this.sendToolResponse(call.id, { success: true, message: `Opened ${url}` });
      }
    }
  }

  disconnect() {
    if (this.session) {
      this.session.close();
      this.session = null;
    }
    this.onStateChange("disconnected");
  }
}
