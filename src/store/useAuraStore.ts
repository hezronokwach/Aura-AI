import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

export interface Task {
    id: string;
    title: string;
    priority: 'low' | 'medium' | 'high';
    day: 'today' | 'tomorrow';
    status: 'pending' | 'completed' | 'postponed' | 'cancelled' | 'delegated';
}

interface AuraState {
    stressScore: number;
    tasks: Task[];
    voiceState: 'idle' | 'listening' | 'speaking' | 'processing';
    sessionHistory: { time: string; score: number }[];

    // Actions
    setStressScore: (score: number) => void;
    setVoiceState: (state: AuraState['voiceState']) => void;
    postponeTask: (id: string) => void;
    manageBurnout: (taskId?: string, adjustmentType?: 'postpone' | 'cancel' | 'delegate') => { success: boolean; message: string };
    addTask: (task: Task) => void;
    addSessionData: (data: { time: string; score: number }) => void;
    resetSession: () => void;
}

export const useAuraStore = create<AuraState>()(
    devtools(
        persist(
            (set) => ({
                stressScore: 0,
                voiceState: 'idle',
                tasks: [
                    { id: '1', title: 'Chemistry Lab Report', priority: 'high', day: 'today', status: 'pending' },
                    { id: '2', title: 'Social Mixer', priority: 'low', day: 'today', status: 'pending' },
                    { id: '3', title: 'Deep Work Session', priority: 'medium', day: 'today', status: 'pending' },
                ],
                sessionHistory: [],

                setStressScore: (score) => set((state) => ({
                    stressScore: score,
                    sessionHistory: [...state.sessionHistory, { time: new Date().toLocaleTimeString(), score }].slice(-20)
                })),

                setVoiceState: (voiceState) => set({ voiceState }),

                postponeTask: (id) => set((state) => {
                    console.log(`[STORE] Postponing task: ${id}`);
                    return {
                        tasks: state.tasks.map((t) =>
                            t.id === id ? { ...t, day: 'tomorrow', status: 'postponed' } : t
                        ),
                    };
                }),

                manageBurnout: (taskId, adjustmentType = 'postpone') => {
                    let message = "";
                    let success = false;

                    set((state) => {
                        // Resilient ID check (handles string vs number)
                        const taskIndex = state.tasks.findIndex(t => String(t.id) === String(taskId));

                        if (taskIndex === -1) {
                            message = `Task with ID ${taskId} not found. Available IDs: ${state.tasks.map(t => t.id).join(', ')}`;
                            return state;
                        }

                        const task = state.tasks[taskIndex];
                        const updatedTasks = [...state.tasks];

                        if (adjustmentType === 'postpone') {
                            updatedTasks[taskIndex] = { ...task, day: 'tomorrow', status: 'postponed' };
                            message = `Postponed "${task.title}" to tomorrow.`;
                        } else if (adjustmentType === 'cancel') {
                            updatedTasks[taskIndex] = { ...task, status: 'cancelled' };
                            message = `Cancelled "${task.title}".`;
                        } else if (adjustmentType === 'delegate') {
                            updatedTasks[taskIndex] = { ...task, status: 'delegated' };
                            message = `Marked "${task.title}" for delegation.`;
                        }

                        success = true;
                        console.log(`[STORE] manageBurnout applied: ${message}`, updatedTasks);
                        return { tasks: updatedTasks };
                    });

                    return { success, message };
                },

                addTask: (task) => set((state) => ({
                    tasks: [...state.tasks, task],
                })),

                addSessionData: (data) => set((state) => ({
                    sessionHistory: [...state.sessionHistory, data].slice(-20),
                })),

                resetSession: () => set({ stressScore: 0, sessionHistory: [] }),
            }),
            {
                name: 'aura-ai-storage', // unique name for localStorage
            }
        )
    )
);
