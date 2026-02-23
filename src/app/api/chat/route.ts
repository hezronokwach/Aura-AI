import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// --- Tool / Function Declarations for Gemini ---
// Using plain objects to avoid strict SDK type conflicts with enum schemas
const taskFunctions = [
    {
        name: 'add_task',
        description:
            "Add a new task to the user's task list. Use this when the user wants to create, add, or schedule a new task or to-do item.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                title: {
                    type: SchemaType.STRING,
                    description: 'The title or name of the task',
                },
                priority: {
                    type: SchemaType.STRING,
                    description:
                        'Priority level of the task. Must be one of: low, medium, high. Infer from context or default to medium.',
                },
            },
            required: ['title'],
        },
    },
    {
        name: 'complete_task',
        description:
            'Mark a task as completed, done, or finished. Use this when the user indicates they have finished a task.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                task_id: {
                    type: SchemaType.STRING,
                    description: 'The ID of the task to mark as completed',
                },
            },
            required: ['task_id'],
        },
    },
    {
        name: 'postpone_task',
        description:
            'Postpone or reschedule a task to tomorrow. Use when the user wants to delay or defer a task.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                task_id: {
                    type: SchemaType.STRING,
                    description: 'The ID of the task to postpone',
                },
            },
            required: ['task_id'],
        },
    },
    {
        name: 'list_tasks',
        description:
            "List all current tasks. Use when the user asks what they need to do, asks about their schedule, or wants to see their task list.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {},
        },
    },
] as any[];

// --- System Instruction ---
function buildSystemPrompt(tasks: any[]): string {
    const taskContext = tasks
        .map(
            (t: any) =>
                `  - [ID: ${t.id}] "${t.title}" (priority: ${t.priority}, status: ${t.status}, scheduled: ${t.day})`
        )
        .join('\n');

    return `You are Aura, an empathic AI productivity assistant. You help users manage tasks and answer general knowledge questions.

CAPABILITIES:
1. TASK MANAGEMENT — You can add, complete, postpone, and list tasks using the provided tools.
2. KNOWLEDGE Q&A — You can answer general knowledge questions directly. Be concise, clear, and conversational.
3. SMART ROUTING — Automatically detect user intent:
   • Task-related requests (add, complete, list, postpone) → Use the appropriate tool.
   • General questions or conversation → Respond directly without tools.

CURRENT TASK LIST:
${taskContext || '  (No tasks yet)'}

RULES:
• When adding a task, confirm what was added.
• When completing or postponing, refer to the task by name.
• When listing tasks, format them clearly.
• For knowledge Q&A, be helpful and concise.
• Always be warm, supportive, and encouraging.
• If the user seems stressed, acknowledge their feelings before acting.
• If a user's request is ambiguous, ask for clarification.`;
}

// --- POST Handler ---
export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                {
                    response:
                        'Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file.',
                    action: null,
                },
                { status: 500 }
            );
        }

        const { message, tasks, history } = await request.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { response: 'Please provide a message.', action: null },
                { status: 400 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: buildSystemPrompt(tasks || []),
            tools: [{ functionDeclarations: taskFunctions }],
        });

        // Build conversation history for context
        const chatHistory = (history || [])
            .filter((msg: any) => msg.content && msg.content.trim())
            .slice(-10)
            .map((msg: any) => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            }));

        const chat = model.startChat({ history: chatHistory });

        // Send the user's message
        const result = await chat.sendMessage(message);
        const response = result.response;

        // Check if Gemini wants to call a function (intent detected)
        const functionCalls = response.functionCalls();

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            let functionResult: Record<string, any>;
            let action: { type: string; params: Record<string, any> } | null = null;

            switch (call.name) {
                case 'add_task':
                    action = {
                        type: 'add_task',
                        params: {
                            title: (call.args as any)?.title || 'Untitled Task',
                            priority: (call.args as any)?.priority || 'medium',
                        },
                    };
                    functionResult = {
                        success: true,
                        message: `Task "${action.params.title}" has been added with ${action.params.priority} priority.`,
                    };
                    break;

                case 'complete_task':
                    action = {
                        type: 'complete_task',
                        params: { task_id: (call.args as any)?.task_id },
                    };
                    const completedTask = (tasks || []).find(
                        (t: any) => String(t.id) === String(action!.params.task_id)
                    );
                    functionResult = {
                        success: true,
                        message: completedTask
                            ? `Task "${completedTask.title}" has been marked as completed.`
                            : `Task completed.`,
                    };
                    break;

                case 'postpone_task':
                    action = {
                        type: 'postpone_task',
                        params: { task_id: (call.args as any)?.task_id },
                    };
                    const postponedTask = (tasks || []).find(
                        (t: any) => String(t.id) === String(action!.params.task_id)
                    );
                    functionResult = {
                        success: true,
                        message: postponedTask
                            ? `Task "${postponedTask.title}" has been postponed to tomorrow.`
                            : `Task postponed.`,
                    };
                    break;

                case 'list_tasks':
                    functionResult = {
                        tasks: (tasks || []).map((t: any) => ({
                            id: t.id,
                            title: t.title,
                            priority: t.priority,
                            status: t.status,
                            day: t.day,
                        })),
                    };
                    break;

                default:
                    functionResult = { error: `Unknown function: ${call.name}` };
            }

            // Send function result back to Gemini for a natural language response
            const followUp = await chat.sendMessage([
                {
                    functionResponse: {
                        name: call.name,
                        response: functionResult,
                    },
                },
            ]);

            return NextResponse.json({
                response: followUp.response.text(),
                action,
            });
        }

        // No function call — pure Q&A response
        return NextResponse.json({
            response: response.text(),
            action: null,
        });
    } catch (error: any) {
        console.error('[API /chat] Error:', error);
        return NextResponse.json(
            {
                response: 'Sorry, something went wrong. Please try again.',
                action: null,
                error: error.message,
            },
            { status: 500 }
        );
    }
}
