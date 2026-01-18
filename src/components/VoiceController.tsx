'use client';

import { useHume } from '@/hooks/useHumeHandler';
import { Mic, MicOff, PhoneOff, Play, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmotionVisualizer } from './EmotionVisualizer';

export const VoiceController = () => {
    const {
        status,
        isMicMuted,
        error,
        startSession,
        endSession,
        toggleMic,
        emotions
    } = useHume();

    const isActive = status === 'ACTIVE';
    const isConnecting = status === 'CONNECTING';

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 z-50">
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{
                            type: 'spring',
                            damping: 20,
                            stiffness: 300
                        }}
                    >
                        <EmotionVisualizer emotions={emotions} />
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-stressed/10 border border-stressed/20 px-4 py-2 rounded-full text-stressed text-xs flex items-center gap-2 shadow-lg backdrop-blur-md"
                >
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                </motion.div>
            )}

            <div className="flex items-center gap-3 bg-card/80 backdrop-blur-2xl border border-white/10 p-2.5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-white/5">
                {!isActive ? (
                    <button
                        onClick={() => startSession()}
                        disabled={isConnecting}
                        className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold uppercase tracking-widest text-[10px] transition-all duration-500 shadow-xl ${isConnecting
                            ? 'bg-white/5 text-white/20'
                            : 'bg-calm text-white hover:bg-calm/90 hover:scale-105 active:scale-95'
                            }`}
                    >
                        {isConnecting ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Play className="w-3 h-3 fill-current" />
                        )}
                        {isConnecting ? 'Waking up Aura' : 'Start Session'}
                    </button>
                ) : (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleMic}
                            className={`p-3.5 rounded-full transition-all duration-300 shadow-lg ${isMicMuted
                                ? 'bg-stressed text-white hover:bg-stressed/90 hover:scale-110'
                                : 'bg-calm text-white hover:bg-calm/90 hover:scale-110 shadow-[0_0_20px_rgba(20,184,166,0.3)]'
                                }`}
                        >
                            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>

                        <div className="w-px h-8 bg-white/10 mx-1" />

                        <button
                            onClick={endSession}
                            className="p-3.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-white/60 hover:text-white transition-all duration-300"
                        >
                            <PhoneOff className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            {isActive && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    className="text-[9px] uppercase tracking-[0.3em] font-black text-white pointer-events-none"
                >
                    Aura Presence Active
                </motion.div>
            )}
        </div>
    );
};
