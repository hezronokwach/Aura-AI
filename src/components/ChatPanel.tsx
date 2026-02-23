'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    MessageSquare,
    Bot,
    User,
    Sparkles,
    X,
    Mic,
    Trash2,
} from 'lucide-react';
import { useAuraStore } from '@/store/useAuraStore';

export const ChatPanel = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatMessages = useAuraStore((state) => state.chatMessages);
    const addChatMessage = useAuraStore((state) => state.addChatMessage);
    const clearChat = useAuraStore((state) => state.clearChat);
    const tasks = useAuraStore((state) => state.tasks);
    const manageBurnout = useAuraStore((state) => state.manageBurnout);
    const addTask = useAuraStore((state) => state.addTask);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');

        // Add user message to store
        addChatMessage({
            role: 'user',
            content: userMessage,
            timestamp: Date.now(),
            source: 'text',
        });

        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    tasks,
                    history: chatMessages
                        .filter((m) => m.source === 'text')
                        .slice(-10),
                }),
            });

            const data = await res.json();

            // Execute any action returned by Gemini's function calling
            if (data.action) {
                switch (data.action.type) {
                    case 'add_task':
                        addTask({
                            id: String(Date.now()),
                            title: data.action.params.title,
                            priority: data.action.params.priority || 'medium',
                            day: 'today',
                            status: 'pending',
                        });
                        break;
                    case 'complete_task':
                        manageBurnout(
                            data.action.params.task_id,
                            'complete'
                        );
                        break;
                    case 'postpone_task':
                        manageBurnout(
                            data.action.params.task_id,
                            'postpone'
                        );
                        break;
                    // list_tasks has no side effect — the response text covers it
                }
            }

            // Add assistant response
            addChatMessage({
                role: 'assistant',
                content: data.response,
                timestamp: Date.now(),
                source: 'text',
            });
        } catch (err) {
            console.error('Chat error:', err);
            addChatMessage({
                role: 'assistant',
                content:
                    'Sorry, I encountered an error. Please check that your GEMINI_API_KEY is set in .env and try again.',
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

    const textMessages = chatMessages.filter((m) => m.source === 'text');

    return (
        <>
            {/* Floating Chat Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-[0_8px_32px_rgba(20,184,166,0.4)] flex items-center justify-center hover:shadow-[0_12px_40px_rgba(20,184,166,0.5)] transition-shadow"
                    >
                        <MessageSquare className="w-6 h-6" />
                        {textMessages.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                                {textMessages.length > 9
                                    ? '9+'
                                    : textMessages.length}
                            </span>
                        )}
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{
                            type: 'spring',
                            damping: 25,
                            stiffness: 300,
                        }}
                        className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-3rem)] flex flex-col rounded-3xl border border-white/15 bg-slate-950/95 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/5 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-teal-500/10 to-cyan-500/10">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white tracking-tight">
                                        Aura AI Chat
                                    </h3>
                                    <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                                        Text Assistant • Gemini
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {textMessages.length > 0 && (
                                    <button
                                        onClick={clearChat}
                                        className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-all"
                                        title="Clear chat"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                            {textMessages.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center h-full text-center px-6 py-12">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/20 flex items-center justify-center mb-4">
                                        <Bot className="w-8 h-8 text-teal-400/60" />
                                    </div>
                                    <h4 className="text-sm font-semibold text-white/60 mb-2">
                                        Hi! I&apos;m Aura
                                    </h4>
                                    <p className="text-xs text-white/30 leading-relaxed mb-6">
                                        I can help you manage tasks and answer
                                        questions. Try typing something like:
                                    </p>
                                    <div className="space-y-2 w-full">
                                        {[
                                            'Add buy groceries to my tasks',
                                            'What do I still need to do?',
                                            'Explain what machine learning is',
                                        ].map((suggestion) => (
                                            <button
                                                key={suggestion}
                                                onClick={() => {
                                                    setInput(suggestion);
                                                    inputRef.current?.focus();
                                                }}
                                                className="w-full text-left px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-xs text-white/50 hover:text-white/70 transition-all"
                                            >
                                                &quot;{suggestion}&quot;
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                textMessages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            type: 'spring',
                                            damping: 20,
                                            stiffness: 300,
                                        }}
                                        className={`flex gap-3 ${msg.role === 'user'
                                                ? 'flex-row-reverse'
                                                : 'flex-row'
                                            }`}
                                    >
                                        {/* Avatar */}
                                        <div
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                                                    ? 'bg-cyan-500/20'
                                                    : 'bg-teal-500/20'
                                                }`}
                                        >
                                            {msg.role === 'user' ? (
                                                <User className="w-3.5 h-3.5 text-cyan-400" />
                                            ) : (
                                                <Bot className="w-3.5 h-3.5 text-teal-400" />
                                            )}
                                        </div>

                                        {/* Message Bubble */}
                                        <div
                                            className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                                    ? 'bg-cyan-500/15 border border-cyan-500/20 text-white/90 rounded-br-md'
                                                    : 'bg-white/5 border border-white/10 text-white/80 rounded-bl-md'
                                                }`}
                                        >
                                            <p className="whitespace-pre-wrap">
                                                {msg.content}
                                            </p>
                                            <span className="text-[9px] opacity-30 mt-1 block">
                                                {new Date(
                                                    msg.timestamp
                                                ).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))
                            )}

                            {/* Loading Indicator */}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-3"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-3.5 h-3.5 text-teal-400" />
                                    </div>
                                    <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
                                        <div className="flex gap-1.5">
                                            <span
                                                className="w-2 h-2 rounded-full bg-teal-400/60 animate-bounce"
                                                style={{
                                                    animationDelay: '0ms',
                                                }}
                                            />
                                            <span
                                                className="w-2 h-2 rounded-full bg-teal-400/60 animate-bounce"
                                                style={{
                                                    animationDelay: '150ms',
                                                }}
                                            />
                                            <span
                                                className="w-2 h-2 rounded-full bg-teal-400/60 animate-bounce"
                                                style={{
                                                    animationDelay: '300ms',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Voice Indicator */}
                        <VoiceIndicator />

                        {/* Input Area */}
                        <div className="p-3 border-t border-white/10 bg-slate-950/50">
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-1 focus-within:border-teal-500/30 focus-within:ring-1 focus-within:ring-teal-500/20 transition-all">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask Aura anything..."
                                    disabled={isLoading}
                                    className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none py-3"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className={`p-2 rounded-xl transition-all ${input.trim() && !isLoading
                                            ? 'bg-teal-500 text-white hover:bg-teal-400 shadow-lg shadow-teal-500/30'
                                            : 'text-white/20'
                                        }`}
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[9px] text-center text-white/20 mt-2 font-medium tracking-wide">
                                Powered by Gemini • Task Management & Q&A
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

// Small sub-component showing active voice state
const VoiceIndicator = () => {
    const voiceState = useAuraStore((state) => state.voiceState);

    if (voiceState === 'idle') return null;

    return (
        <div className="px-4 py-2 border-t border-white/5 bg-teal-500/5">
            <div className="flex items-center gap-2">
                <Mic className="w-3 h-3 text-teal-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400/60">
                    Voice {voiceState}
                </span>
            </div>
        </div>
    );
};
