'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Mic, MicOff, PhoneOff, Bot, User, Sparkles,
    Volume2, AlertTriangle, Loader2
} from 'lucide-react';
import { useAuraStore } from '@/store/useAuraStore';
import { useHume } from '@/hooks/useHumeHandler';
import type { ChatMessage } from '@/types';

export const UnifiedChat = () => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pendingMicStart, setPendingMicStart] = useState(false);

    const chatMessages = useAuraStore((s) => s.chatMessages);
    const addChatMessage = useAuraStore((s) => s.addChatMessage);
    const tasks = useAuraStore((s) => s.tasks);
    const manageBurnout = useAuraStore((s) => s.manageBurnout);
    const addTask = useAuraStore((s) => s.addTask);
    const addActionLog = useAuraStore((s) => s.addActionLog);
    const stressScore = useAuraStore((s) => s.stressScore);

    const {
        status, isMicMuted, error,
        startSession, endSession, toggleMic
    } = useHume();

    const isVoiceActive = status === 'ACTIVE';
    const isConnecting = status === 'CONNECTING';

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, [chatMessages]);

    // Auto-start mic after voice session connects
    useEffect(() => {
        if (pendingMicStart && isVoiceActive) {
            toggleMic();
            setPendingMicStart(false);
        }
    }, [pendingMicStart, isVoiceActive, toggleMic]);

    const handleMicClick = useCallback(async () => {
        if (isConnecting) return;
        if (!isVoiceActive) {
            setPendingMicStart(true);
            await startSession();
        } else {
            toggleMic();
        }
    }, [isVoiceActive, isConnecting, startSession, toggleMic]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const userMessage = input.trim();
        setInput('');

        addChatMessage({ role: 'user', content: userMessage, timestamp: Date.now(), source: 'text' });
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    tasks,
                    history: chatMessages.filter(m => m.source === 'text').slice(-10),
                }),
            });
            const data = await res.json();

            if (data.action) {
                switch (data.action.type) {
                    case 'add_task': {
                        const title = data.action.params.title;
                        const priority = data.action.params.priority || 'medium';
                        addTask({
                            id: String(Date.now()),
                            title,
                            priority,
                            day: 'today',
                            status: 'pending',
                        });
                        addActionLog({
                            timestamp: Date.now(),
                            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                            triggerEmotion: 'Text Chat',
                            action: `Added "${title}" (${priority})`,
                            outcome: 'success',
                            stressScore,
                        });
                        break;
                    }
                    case 'complete_task':
                        manageBurnout(data.action.params.task_id, 'complete');
                        break;
                    case 'postpone_task':
                        manageBurnout(data.action.params.task_id, 'postpone');
                        break;
                }
            }

            addChatMessage({ role: 'assistant', content: data.response, timestamp: Date.now(), source: 'text' });
        } catch (err) {
            console.error('Chat error:', err);
            addChatMessage({
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please check your GEMINI_API_KEY in .env.',
                timestamp: Date.now(),
                source: 'text',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4 scrollbar-thin min-h-0">
                {chatMessages.length === 0 ? (
                    <WelcomeScreen onSuggestionClick={(s) => { setInput(s); inputRef.current?.focus(); }} />
                ) : (
                    chatMessages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))
                )}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
            </div>

            {/* Voice status bar */}
            <AnimatePresence>
                {isVoiceActive && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 py-2.5 flex items-center justify-between bg-teal-500/5 border-t border-teal-500/10">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400/60">
                                    {isMicMuted ? 'Voice Connected · Muted' : 'Listening...'}
                                </span>
                            </div>
                            {error && (
                                <div className="flex items-center gap-1 text-rose-400/60">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span className="text-[10px]">{error}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input bar */}
            <div className="flex-none p-4 border-t border-white/5">
                <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-1.5 focus-within:border-teal-500/30 focus-within:ring-1 focus-within:ring-teal-500/20 transition-all">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask Aura anything..."
                        disabled={isLoading}
                        className="flex-1 bg-transparent text-base text-white placeholder-white/30 outline-none py-3"
                    />

                    {/* Mic */}
                    <button
                        onClick={handleMicClick}
                        disabled={isConnecting}
                        className={`p-2.5 rounded-xl transition-all duration-300 ${isConnecting
                            ? 'text-white/20'
                            : isVoiceActive && !isMicMuted
                                ? 'bg-teal-500/20 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.2)] hover:bg-teal-500/30'
                                : isVoiceActive && isMicMuted
                                    ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25'
                                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                            }`}
                        title={isVoiceActive ? (isMicMuted ? 'Unmute mic' : 'Mute mic') : 'Start voice session'}
                    >
                        {isConnecting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isVoiceActive && isMicMuted ? (
                            <MicOff className="w-5 h-5" />
                        ) : (
                            <Mic className="w-5 h-5" />
                        )}
                    </button>

                    {/* End call */}
                    {isVoiceActive && (
                        <button
                            onClick={endSession}
                            className="p-2 rounded-xl text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                            title="End voice session"
                        >
                            <PhoneOff className="w-4 h-4" />
                        </button>
                    )}

                    {/* Send */}
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className={`p-2.5 rounded-xl transition-all duration-300 ${input.trim() && !isLoading
                            ? 'bg-teal-500 text-white hover:bg-teal-400 shadow-lg shadow-teal-500/25'
                            : 'text-white/15'
                            }`}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-[11px] text-center text-white/20 mt-2 font-medium tracking-wide">
                    Type to chat · Click 🎤 for voice
                </p>
            </div>
        </div>
    );
};

/* ─── Sub-components ──────────────────────────────── */

const WelcomeScreen = ({ onSuggestionClick }: { onSuggestionClick: (s: string) => void }) => (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/15 flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10 text-teal-400/50" />
        </div>
        <h2 className="text-3xl font-bold text-white/80 mb-3">Hi, I&apos;m Aura</h2>
        <p className="text-base text-white/35 max-w-md mb-8 leading-relaxed">
            Your AI productivity assistant. I can manage tasks, answer questions, and listen to your voice.
        </p>
        <div className="space-y-2 w-full max-w-sm">
            {[
                { text: 'Add buy groceries to my tasks', icon: '📝' },
                { text: 'What do I still need to do?', icon: '📋' },
                { text: 'Explain what machine learning is', icon: '🧠' },
            ].map((sug) => (
                <button
                    key={sug.text}
                    onClick={() => onSuggestionClick(sug.text)}
                    className="w-full text-left px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-[15px] text-white/50 hover:text-white/70 transition-all flex items-center gap-3"
                >
                    <span>{sug.icon}</span>
                    {sug.text}
                </button>
            ))}
        </div>
    </div>
);

const MessageBubble = ({ message }: { message: ChatMessage }) => {
    const isUser = message.role === 'user';
    const isVoice = message.source === 'voice';

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
        >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${isUser ? 'bg-cyan-500/20' : 'bg-teal-500/20'
                }`}>
                {isUser ? <User className="w-3.5 h-3.5 text-cyan-400" /> : <Bot className="w-3.5 h-3.5 text-teal-400" />}
            </div>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isUser
                ? 'bg-cyan-500/15 border border-cyan-500/20 text-white/90 rounded-br-md'
                : 'bg-white/5 border border-white/10 text-white/80 rounded-bl-md'
                }`}>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] opacity-30">
                        {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isVoice && <Volume2 className="w-2.5 h-2.5 opacity-20" />}
                </div>
            </div>
        </motion.div>
    );
};

const TypingIndicator = () => (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
        <div className="w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0 mt-1">
            <Bot className="w-3.5 h-3.5 text-teal-400" />
        </div>
        <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
            <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-teal-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-teal-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
    </motion.div>
);
