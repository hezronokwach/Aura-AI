'use client';

import { useHume } from '@/hooks/useHumeHandler';
import { Mic, MicOff, PhoneOff, Play, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export const VoiceController = () => {
    const {
        status,
        isMicMuted,
        error,
        startSession,
        endSession,
        toggleMic
    } = useHume();

    const isActive = status === 'ACTIVE';
    const isConnecting = status === 'CONNECTING';

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-50">
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-stressed/10 border border-stressed/20 px-4 py-2 rounded-full text-stressed text-xs flex items-center gap-2"
                >
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                </motion.div>
            )}

            <div className="flex items-center gap-3 bg-card/80 backdrop-blur-xl border border-border p-2 rounded-full shadow-2xl">
                {!isActive ? (
                    <button
                        onClick={() => startSession()}
                        disabled={isConnecting}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${isConnecting
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-calm text-white hover:bg-calm/90'
                            }`}
                    >
                        {isConnecting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Play className="w-4 h-4 fill-current" />
                        )}
                        {isConnecting ? 'Waking up Aura...' : 'Start Session'}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={toggleMic}
                            className={`p-3 rounded-full transition-all ${isMicMuted
                                    ? 'bg-stressed text-white hover:bg-stressed/90'
                                    : 'bg-calm/10 text-calm hover:bg-calm/20'
                                }`}
                        >
                            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>

                        <div className="w-px h-6 bg-border mx-1" />

                        <button
                            onClick={endSession}
                            className="p-3 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-all"
                        >
                            <PhoneOff className="w-5 h-5" />
                        </button>
                    </>
                )}
            </div>

            {isActive && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] uppercase tracking-widest opacity-40 font-bold"
                >
                    Aura is Listening
                </motion.div>
            )}
        </div>
    );
};
