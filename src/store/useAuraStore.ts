import { create } from 'zustand';

export interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  day: 'today' | 'tomorrow';
  status: 'pending' | 'completed' | 'postponed';
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
  addTask: (task: Task) => void;
  addSessionData: (data: { time: string; score: number }) => void;
}

export const useAuraStore = create<AuraState>((set) => ({
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

  postponeTask: (id) => set((state) => ({
    tasks: state.tasks.map((t) => 
      t.id === id ? { ...t, day: 'tomorrow', status: 'postponed' } : t
    ),
  })),

  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task],
  })),

  addSessionData: (data) => set((state) => ({
    sessionHistory: [...state.sessionHistory, data].slice(-20),
  })),
}));
