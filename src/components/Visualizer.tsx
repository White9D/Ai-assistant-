
import React from 'react';
import { motion } from 'motion/react';

interface VisualizerProps {
  state: 'disconnected' | 'connecting' | 'connected' | 'listening' | 'speaking';
}

export const Visualizer: React.FC<VisualizerProps> = ({ state }) => {
  const isIdle = state === 'disconnected' || state === 'connected';
  const isConnecting = state === 'connecting';
  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Outer Glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-pink-500/20 blur-3xl"
        animate={{
          scale: isSpeaking ? [1, 1.2, 1] : isListening ? [1, 1.1, 1] : 1,
          opacity: isIdle ? 0.2 : 0.6,
        }}
        transition={{
          duration: isSpeaking ? 1 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main Pulse Circle */}
      <motion.div
        className={`w-32 h-32 rounded-full border-2 ${
          isSpeaking ? 'border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.5)]' :
          isListening ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)]' :
          isConnecting ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]' :
          'border-gray-600'
        } flex items-center justify-center bg-black/40 backdrop-blur-sm z-10`}
        animate={{
          scale: isSpeaking ? [1, 1.15, 1] : isListening ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Inner Waveform Simulation */}
        <div className="flex items-center gap-1 h-8">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className={`w-1 rounded-full ${
                isSpeaking ? 'bg-pink-500' :
                isListening ? 'bg-cyan-400' :
                isConnecting ? 'bg-yellow-400' :
                'bg-gray-600'
              }`}
              animate={{
                height: isSpeaking ? [8, 24, 12, 32, 8] : isListening ? [8, 16, 8] : 8,
              }}
              transition={{
                duration: 0.5 + Math.random() * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Orbiting Particles */}
      {!isIdle && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-2 h-2 rounded-full ${
                isSpeaking ? 'bg-pink-400' :
                isListening ? 'bg-cyan-300' :
                'bg-yellow-300'
              } blur-[1px]`}
              animate={{
                rotate: 360,
                x: [Math.cos(i * 120) * 100, Math.cos((i * 120) + 120) * 100, Math.cos((i * 120) + 240) * 100, Math.cos(i * 120) * 100],
                y: [Math.sin(i * 120) * 100, Math.sin((i * 120) + 120) * 100, Math.sin((i * 120) + 240) * 100, Math.sin(i * 120) * 100],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
