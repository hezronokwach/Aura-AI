import { useState, useRef, useEffect, useCallback } from 'react';
import { Hume, HumeClient } from 'hume';
import { useAuraStore } from '@/store/useAuraStore';

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
    const { setStressScore, setVoiceState, postponeTask, tasks } = useAuraStore();
    const [status, setStatus] = useState<HumeStatus>('IDLE');
    const [messages, setMessages] = useState<HumeMessage[]>([]);
    const [liveTranscript, setLiveTranscript] = useState<string>('');
    const [isMicMuted, setIsMicMuted] = useState(true);
    const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
    const isSpeakerMutedRef = useRef(false);
    const [error, setError] = useState<string | null>(null);

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
            'Anxiety': 1.0,
            'Distress': 1.2,
            'Tiredness': 0.8,
            'Awkwardness': 0.3,
            'Confusion': 0.5
        };

        let calculatedScore = 0;
        let totalWeight = 0;

        Object.entries(weights).forEach(([emotion, weight]) => {
            const score = prosody.scores[emotion] || 0;
            calculatedScore += score * weight;
            totalWeight += weight;
        });

        // Normalize and scale to 0-100
        const finalScore = Math.min(100, Math.round((calculatedScore / totalWeight) * 100 * 2)); // Multiplying by 2 to make it more sensitive
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
                            setStressScore(score);
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
                console.log('Hume triggered tool:', msg.name);
                if (msg.name === 'manage_burnout') {
                    // Try to find a low priority task if no ID provided
                    const taskToPostpone = tasks.find(t => t.day === 'today' && t.priority === 'low') || tasks.find(t => t.day === 'today');

                    if (taskToPostpone) {
                        postponeTask(taskToPostpone.id);

                        // Send response back to Hume
                        socketRef.current?.sendToolResponse({
                            type: 'tool_response',
                            tool_call_id: msg.tool_call_id,
                            content: `Successfully postponed task: ${taskToPostpone.title}. The user's schedule is now lighter.`
                        });
                    } else {
                        socketRef.current?.sendToolResponse({
                            type: 'tool_response',
                            tool_call_id: msg.tool_call_id,
                            content: "No tasks found that could be postponed at this time."
                        });
                    }
                }
                break;

            case 'error':
                console.error('Hume message error:', msg.message);
                setError(msg.message);
                break;

            default:
                // console.log('Unhandled message type:', msg.type);
                break;
        }
    }, [setStressScore, setVoiceState, tasks, postponeTask]);

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
        updateSessionSettings
    };
};
