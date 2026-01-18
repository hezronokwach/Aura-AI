import { useState, useRef, useEffect, useCallback } from 'react';
import { HumeClient } from 'hume';
import { useAuraStore, type Task } from '@/store/useAuraStore';

import {
    convertBlobToBase64,
    ensureSingleValidAudioTrack,
    getAudioStream,
    getBrowserSupportedMimeType,
    EVIWebAudioPlayer,
    MimeType
} from 'hume';

export type HumeStatus = 'IDLE' | 'CONNECTING' | 'ACTIVE' | 'ERROR';

export interface HumeMessage {
    role: 'user' | 'assistant';
    text: string;
    timestamp?: number;
}

export const useHume = () => {
    const { setStressScore, setVoiceState, tasks } = useAuraStore();
    const [status, setStatus] = useState<HumeStatus>('IDLE');
    const [messages, setMessages] = useState<HumeMessage[]>([]);
    const [liveTranscript, setLiveTranscript] = useState<string>('');
    const [isMicMuted, setIsMicMuted] = useState(true);
    const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
    const isSpeakerMutedRef = useRef(false);
    const [error, setError] = useState<string | null>(null);
    const [emotions, setEmotions] = useState<Record<string, number>>({});

    const socketRef = useRef<any>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const playerRef = useRef<EVIWebAudioPlayer | null>(null);

    useEffect(() => {
        return () => {
            if (recorderRef.current) {
                recorderRef.current.stream.getTracks().forEach(t => t.stop());
            }
            if (playerRef.current) {
                playerRef.current.dispose();
            }
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);

    const calculateStress = (prosody: any) => {
        if (!prosody?.scores) return 0;

        // Weights for different "stressful" emotions
        const weights: Record<string, number> = {
            'anxiety': 2.5,
            'distress': 3.0,
            'fear': 2.0,
            'tiredness': 1.2,
            'anger': 2.5,
            'frustration': 2.8,
            'sorrow': 1.0,
            'disappointment': 1.2,
            'confusion': 0.8,
            'disgust': 0.6,
            'pain': 1.5,
            'calmness': -1.2,
            'contentment': -1.0,
            'relief': -1.8
        };

        let stressSum = 0;
        let calmSum = 0;
        console.group('Stress Calculation Analysis');

        Object.entries(prosody.scores).forEach(([emotion, score]: [string, any]) => {
            const eLower = emotion.toLowerCase();
            const weight = weights[eLower] || 0;
            if (weight !== 0) {
                const contribution = score * weight;
                if (weight > 0) {
                    stressSum += contribution;
                } else {
                    calmSum += contribution;
                }

                if (Math.abs(contribution) > 0.005) {
                    console.log(`- ${emotion}: score=${score.toFixed(3)}, weight=${weight}, contrib=${contribution.toFixed(3)}`);
                }
            }
        });

        // Intervention: If any stress is detected, damp the calming effect significantly
        const effectiveCalm = stressSum > 0.05 ? calmSum * 0.2 : calmSum;
        const rawScore = stressSum + effectiveCalm;

        // Normalize and scale to 0-100
        const finalScore = Math.max(0, Math.min(100, Math.round(rawScore * 300))); // Boosted sensitivity

        console.log(`Stress Sum: ${stressSum.toFixed(4)}, Calm Sum: ${calmSum.toFixed(4)} (Effective: ${effectiveCalm.toFixed(4)})`);
        console.log(`Final Scaled Stress Score: ${finalScore}`);
        console.groupEnd();

        return finalScore;
    };

    const startAudioCapture = useCallback(async (socket: any) => {
        try {
            const mimeTypeResult = getBrowserSupportedMimeType();
            const mimeType = mimeTypeResult.success ? mimeTypeResult.mimeType : MimeType.WEBM;

            const micAudioStream = await getAudioStream();
            ensureSingleValidAudioTrack(micAudioStream);

            const recorder = new MediaRecorder(micAudioStream, { mimeType });

            recorder.ondataavailable = async (e: BlobEvent) => {
                if (e.data.size > 0 && socket.readyState === WebSocket.OPEN) {
                    const data = await convertBlobToBase64(e.data);
                    socket.sendAudioInput({ data });
                }
            };

            recorder.onerror = (e) => {
                console.error('MediaRecorder error:', e);
                setError('Microphone error');
            };

            recorder.start(80);
            recorderRef.current = recorder;
            setIsMicMuted(false);
            setVoiceState('listening');

            console.log('Audio capture started');
        } catch (err: any) {
            console.error('Failed to start audio capture:', err);
            setError(err.message);
        }
    }, [setVoiceState]);

    const stopAudioCapture = useCallback(() => {
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
            recorderRef.current.stop();
            recorderRef.current.stream.getTracks().forEach(t => t.stop());
            recorderRef.current = null;
            setIsMicMuted(true);
            setVoiceState('idle');
            console.log('Audio capture stopped');
        }
    }, [setVoiceState]);

    const handleOpen = useCallback(async () => {
        console.log('Hume socket opened');
        setStatus('ACTIVE');

        const player = new EVIWebAudioPlayer();
        await player.init();
        playerRef.current = player;
    }, []);

    const handleMessage = useCallback(async (msg: any) => {
        console.log('Hume message:', msg.type);

        switch (msg.type) {
            case 'audio_output':
                if (playerRef.current && !isSpeakerMutedRef.current) {
                    await playerRef.current.enqueue(msg);
                }
                break;

            case 'user_message':
                if (msg.message?.content) {
                    if (msg.interim) {
                        setLiveTranscript(msg.message.content);
                    } else {
                        setLiveTranscript('');
                        setMessages(prev => [...prev, {
                            role: 'user',
                            text: msg.message.content,
                            timestamp: Date.now()
                        }]);

                        // Calculate Stress from User Message
                        if (msg.models?.prosody) {
                            const score = calculateStress(msg.models.prosody);
                            console.log('Calculated stress score:', score, 'from prosody:', msg.models.prosody);
                            setStressScore(score);
                            setEmotions(msg.models.prosody.scores || {});
                        }
                    }
                }
                break;

            case 'assistant_message':
                if (msg.message?.content) {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        text: msg.message.content,
                        timestamp: Date.now()
                    }]);
                    setVoiceState('speaking');
                }
                break;

            case 'assistant_end':
                setVoiceState('listening');
                break;

            case 'user_interruption':
                console.log('User interrupted');
                if (playerRef.current) {
                    playerRef.current.stop();
                }
                setVoiceState('listening');
                break;

            case 'tool_call':
                const toolName = msg.name;
                const toolCallId = msg.toolCallId || msg.tool_call_id;
                const toolParams = msg.parameters;

                console.warn('!!! HUME TOOL CALL RECEIVED !!!', toolName, toolParams);

                if (toolName === 'manage_burnout' && toolCallId) {
                    let params: any = {};
                    try {
                        params = typeof toolParams === 'string'
                            ? JSON.parse(toolParams)
                            : toolParams;
                    } catch (e) {
                        console.error('Failed to parse tool parameters', e);
                    }

                    const taskId = params.task_id || params.taskId;
                    const adjustmentType = params.adjustment_type || params.adjustmentType || 'postpone';

                    console.log(`[AURA TOOL] EXECUTING: task=${taskId}, action=${adjustmentType}`);

                    const result = useAuraStore.getState().manageBurnout(taskId, adjustmentType);
                    console.log(`[AURA TOOL] RESULT:`, result.message);

                    if (socketRef.current?.sendToolResponseMessage) {
                        socketRef.current.sendToolResponseMessage({
                            type: 'tool_response',
                            toolCallId: toolCallId,
                            content: result.message
                        });
                    } else if (socketRef.current?.sendToolResponse) {
                        socketRef.current.sendToolResponse({
                            type: 'tool_response',
                            tool_call_id: toolCallId,
                            content: result.message
                        });
                    }
                }
                break;

            case 'error':
                console.error('Hume message error:', msg.message);
                setError(msg.message);
                break;

            default:
                console.log('DEBUG: Received message of type:', msg.type, msg);
                break;
        }
    }, [setStressScore, setVoiceState]);

    // Update Hume context whenever tasks change
    useEffect(() => {
        if (socketRef.current && status === 'ACTIVE') {
            const taskContext = tasks.map((t: Task) =>
                `- [${t.id}] ${t.title} (${t.priority} priority, status: ${t.status}, due: ${t.day})`
            ).join('\n');

            const baseInstructions = `
You are Aura, an empathic productivity assistant.
CORE RULES:
1. Always use the 'manage_burnout' tool when moving, cancelling, or delegating tasks.
2. Refer to tasks by their IDs (e.g., '1', '2').
3. Be empathic if the user sounds stressed.
`;

            const fullPrompt = `${baseInstructions}\n\nUSER TASK LIST:\n${taskContext}\n\nIf the user asks to move a task, you MUST use the manage_burnout tool.`;

            console.group('Aura Context Sync');
            console.log('Injecting tasks and reinforcing tool rules...');

            socketRef.current.sendSessionSettings({
                system_prompt: fullPrompt
            });
            console.groupEnd();
        }
    }, [tasks, status]);

    const handleError = useCallback((err: Event | Error) => {
        console.error('Hume socket error:', err);
        setError('Connection error');
        setStatus('ERROR');
    }, []);

    const handleClose = useCallback((e: any) => {
        console.log('Hume socket closed:', e);
        setStatus('IDLE');
        setVoiceState('idle');

        if (recorderRef.current) {
            recorderRef.current.stream.getTracks().forEach(t => t.stop());
            recorderRef.current = null;
        }
        if (playerRef.current) {
            playerRef.current.dispose();
            playerRef.current = null;
        }
    }, [setVoiceState]);

    const startSession = useCallback(async (options?: { configId?: string; voiceId?: string; language?: string }) => {
        try {
            if (socketRef.current) {
                console.log('Session already active');
                return;
            }

            setStatus('CONNECTING');
            setError(null);

            const apiKey = process.env.NEXT_PUBLIC_HUME_API_KEY;
            if (!apiKey) {
                throw new Error('HUME_API_KEY not found in environment variables');
            }

            const client = new HumeClient({ apiKey });
            const configId = options?.configId || process.env.NEXT_PUBLIC_HUME_CONFIG_ID;

            const connectOptions: any = {};
            if (configId) connectOptions.configId = configId;

            const sessionSettings: any = {};
            if (options?.voiceId) sessionSettings.voiceId = options.voiceId;

            if (Object.keys(sessionSettings).length > 0) {
                connectOptions.sessionSettings = sessionSettings;
            }

            const socket = await client.empathicVoice.chat.connect(connectOptions);
            socketRef.current = socket;

            socket.on('open', handleOpen);
            socket.on('message', handleMessage);
            socket.on('error', handleError);
            socket.on('close', handleClose);

        } catch (err: any) {
            console.error('Failed to start Hume session:', err);
            setError(err.message);
            setStatus('ERROR');
        }
    }, [handleOpen, handleMessage, handleError, handleClose]);

    const endSession = useCallback(async () => {
        stopAudioCapture();

        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }

        setStatus('IDLE');
        setMessages([]);
    }, [stopAudioCapture]);

    const updateSessionSettings = useCallback((settings: { voiceId?: string; systemPrompt?: string; context?: string }) => {
        if (socketRef.current) {
            socketRef.current.sendSessionSettings(settings);
            console.log('Session settings updated:', settings);
        }
    }, []);

    const toggleMic = useCallback(async () => {
        if (!socketRef.current) {
            console.log('No active session');
            return;
        }

        if (isMicMuted) {
            await startAudioCapture(socketRef.current);
        } else {
            stopAudioCapture();
        }
    }, [isMicMuted, startAudioCapture, stopAudioCapture]);

    const toggleSpeaker = useCallback(() => {
        const newValue = !isSpeakerMutedRef.current;
        isSpeakerMutedRef.current = newValue;
        setIsSpeakerMuted(newValue);
        if (playerRef.current && newValue) {
            playerRef.current.stop();
        }
    }, []);

    return {
        status,
        messages,
        liveTranscript,
        isMicMuted,
        isSpeakerMuted,
        error,
        startSession,
        endSession,
        toggleMic,
        toggleSpeaker,
        updateSessionSettings,
        emotions
    };
};
