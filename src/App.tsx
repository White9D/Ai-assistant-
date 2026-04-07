
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Power, Settings, Globe, MessageCircleHeart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AudioStreamer } from './lib/audio-streamer';
import { LiveSession, SessionState } from './lib/live-session';
import { Visualizer } from './components/Visualizer';

export default function App() {
  const [state, setState] = useState<SessionState>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const liveSessionRef = useRef<LiveSession | null>(null);

  const handleAudioData = useCallback(async (base64Data: string) => {
    if (liveSessionRef.current) {
      await liveSessionRef.current.sendAudio(base64Data);
    }
  }, []);

  const handleLiveMessage = useCallback((message: any) => {
    if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData) {
      const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
      if (audioStreamerRef.current) {
        audioStreamerRef.current.play(base64Audio);
      }
    }
    if (message.serverContent?.interrupted) {
      if (audioStreamerRef.current) {
        audioStreamerRef.current.stopPlayback();
      }
    }
  }, []);

  const handleSessionError = useCallback((err: string) => {
    console.error("Session error callback:", err);
    if (err.toLowerCase().includes("quota") || err.toLowerCase().includes("limit")) {
      setIsQuotaExceeded(true);
      setError("Babe, we hit the limit. You might need your own API key for this much fun.");
    } else {
      setError("Ugh, something went wrong. Try again, babe?");
    }
    setState("disconnected");
  }, []);

  const handleSelectKey = async () => {
    try {
      if (window.aistudio?.openSelectKey) {
        await window.aistudio.openSelectKey();
        setError(null);
        setIsQuotaExceeded(false);
        // After selecting key, we can try to connect again
        toggleSession();
      } else {
        setError("Key selector not available in this environment.");
      }
    } catch (err) {
      console.error("Failed to open key selector:", err);
    }
  };

  const toggleSession = async () => {
    if (state === "disconnected") {
      try {
        setError(null);
        setIsQuotaExceeded(false);
        
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
          setError("API key is missing. Check your secrets.");
          return;
        }

        audioStreamerRef.current = new AudioStreamer();
        liveSessionRef.current = new LiveSession(
          apiKey,
          handleLiveMessage,
          (newState) => setState(newState),
          handleSessionError
        );

        await liveSessionRef.current.connect();
        await audioStreamerRef.current.start(handleAudioData);
      } catch (err) {
        console.error("Failed to start session:", err);
        handleSessionError(err instanceof Error ? err.message : String(err));
      }
    } else {
      audioStreamerRef.current?.stop();
      liveSessionRef.current?.disconnect();
      setState("disconnected");
    }
  };

  useEffect(() => {
    return () => {
      audioStreamerRef.current?.stop();
      liveSessionRef.current?.disconnect();
    };
  }, []);

  const getStatusText = () => {
    switch (state) {
      case "connecting": return "Hold on, I'm getting ready...";
      case "connected": return "I'm all ears, darling.";
      case "listening": return "Listening... don't be shy.";
      case "speaking": return "Listen to me, babe.";
      default: return "Ready to have some fun?";
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-pink-500/30 flex flex-col items-center justify-center overflow-hidden p-6 relative">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-8 left-0 right-0 flex items-center justify-between px-8 z-20"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.5)]">
            <MessageCircleHeart className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold tracking-tighter text-xl uppercase italic">Pagal AI</span>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <Globe className="w-5 h-5 hover:text-white transition-colors cursor-pointer" />
          <Settings className="w-5 h-5 hover:text-white transition-colors cursor-pointer" />
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex flex-col items-center gap-12 z-10">
        <Visualizer state={state} />

        <div className="text-center space-y-2">
          <motion.h1 
            key={state}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-light tracking-wide text-gray-200"
          >
            {getStatusText()}
          </motion.h1>
          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <p className="text-red-400 text-sm font-mono max-w-md mx-auto">
                {error}
              </p>
              {isQuotaExceeded && (
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={handleSelectKey}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-xs font-medium transition-colors border border-white/10"
                  >
                    Use my own API Key
                  </button>
                  <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] text-gray-500 hover:text-gray-300 underline underline-offset-4"
                  >
                    Learn about Gemini API billing
                  </a>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Control Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleSession}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 group ${
            state === "disconnected" 
              ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
              : "bg-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.6)] border-none"
          }`}
        >
          <AnimatePresence mode="wait">
            {state === "disconnected" ? (
              <motion.div
                key="power"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
              >
                <Power className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors" />
              </motion.div>
            ) : (
              <motion.div
                key="mic"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
              >
                <Mic className="w-8 h-8 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Pulsing Ring for Active State */}
          {state !== "disconnected" && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-pink-500"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </motion.button>
      </div>

      {/* Footer Info */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        className="absolute bottom-8 text-[10px] uppercase tracking-[0.2em] font-mono text-gray-500"
      >
        Voice-to-Voice Real-time Assistant • Gemini 3.1 Flash Live
      </motion.div>

      {/* Sassy Overlay for "Speaking" state */}
      <AnimatePresence>
        {state === "speaking" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-pink-500/5 pointer-events-none z-0"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
