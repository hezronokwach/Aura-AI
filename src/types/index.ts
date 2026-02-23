export interface ActionLog {
    id: string;
    timestamp: number;
    time: string;
    triggerEmotion: string;
    action: string;
    outcome: 'success' | 'cancelled' | 'failed';
    stressScore: number;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    source: 'text' | 'voice';
}
