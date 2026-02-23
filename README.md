# Aura AI: The Empathic Productivity Agent

Aura is a next-generation AI personal assistant that combines **Hume AI's Empathic Voice Interface (EVI)** with **Google Gemini-powered text chat**. It manages your tasks, answers your questions, and provides a unified voice + text interface.

![Aura Visualization](https://img.shields.io/badge/Aesthetics-Zen-teal)
![Framework](https://img.shields.io/badge/Framework-Next.js%2015-black)
![Intelligence](https://img.shields.io/badge/Voice-Hume%20EVI-blueviolet)
![LLM](https://img.shields.io/badge/Text-Gemini%202.0-blue)

---

## Architecture Overview

```
User Input
├── 🎤 Voice → Hume EVI → Tool Calls → Task Actions
└── ⌨️  Text  → Gemini API → Function Calling → Intent Routing → Response

                         ↕ Shared State (Zustand) ↕

                    ┌─────────────────────────┐
                    │    Task Manager Store    │
                    │  (add, complete, list,   │
                    │   postpone, delegate)    │
                    └─────────────────────────┘
                              │
                    ┌─────────────────────────┐
                    │   Firebase (optional)    │
                    │   Session Persistence    │
                    └─────────────────────────┘
```

### Smart Intent Routing
Both voice and text inputs are automatically routed:
- **Task requests** ("Add buy groceries") → Function/tool calling → Executes task action
- **Knowledge questions** ("What is machine learning?") → Direct LLM response
- **Emotional support** ("I'm overwhelmed") → Empathic voice response

---

## Core Functionality

### 1. Task Management (Voice + Text)
- **Add tasks**: *"Add buy groceries to my tasks"* or type it in chat
- **Complete tasks**: *"I finished the Chemistry Lab Report"*
- **List tasks**: *"What do I still need to do?"*
- **Postpone tasks**: *"Move the calculus assignment to tomorrow"*
- Tasks are stored locally via Zustand with localStorage persistence.

### 2. Knowledge Q&A
Ask Aura general knowledge questions through voice or the text chat:
- *"Explain what machine learning is"*
- *"What's the capital of France?"*
- Powered by Google Gemini 2.0 Flash for fast, accurate answers.

### 3. Voice Interaction
Aura supports full voice conversations via Hume AI:
- Start a voice session from the input bar mic button
- Speak naturally — Aura understands task requests and general questions
- Voice and text messages appear in the same unified conversation

### 4. Confirmation Gates
A 5-second countdown modal appears before AI-triggered actions execute:
- Progress bar shows time remaining
- "Undo" button cancels the action
- Auto-executes after timeout

### 5. Action Log
Full audit trail of every AI decision:
- Tracks what action was taken, when, and the outcome
- Visible in the sidebar for transparency

---

## Getting Started

### Prerequisites
- Node.js 18+
- [Hume AI API Key](https://beta.hume.ai/) (for voice)
- [Google Gemini API Key](https://aistudio.google.com/apikey) (for text chat)
- [Firebase Account](https://console.firebase.google.com/) (optional)

### 1. Environment Configuration
Create a `.env` file in the root directory (see `.env.example`):

```bash
# Hume AI (Voice Interface)
NEXT_PUBLIC_HUME_API_KEY=your_api_key
NEXT_PUBLIC_HUME_CONFIG_ID=your_config_id

# Google Gemini (Text Chat + Intent Detection)
GEMINI_API_KEY=your_gemini_api_key

# Firebase (Optional)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 2. Hume Portal Setup
Configure tools in the [Hume Portal](https://beta.hume.ai/evi/configs):

1. **`manage_burnout`** tool:
   - `task_id` (string), `adjustment_type` (enum: postpone/cancel/delegate/complete)
2. **`add_task`** tool:
   - `title` (string), `priority` (enum: low/medium/high)
3. Select a tool-capable supplemental LLM (Gemini 1.5 Flash or Claude 3.5 Sonnet).

### 3. Installation
```bash
npm install
npm run dev
```

---

## Technical Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Voice AI**: Hume AI Empathic Voice Interface (EVI) SDK
- **Text AI**: Google Gemini 2.0 Flash with Function Calling
- **State**: Zustand with localStorage persistence
- **Animations**: Framer Motion (Shared Layout Animations)
- **Persistence**: Firebase Firestore (optional)

---

## Key Files

| File | Purpose |
|------|---------|
| `src/hooks/useHumeHandler.ts` | Voice AI integration + tool handling |
| `src/app/api/chat/route.ts` | Gemini API endpoint with function calling |
| `src/components/UnifiedChat.tsx` | Unified voice + text chat interface |
| `src/store/useAuraStore.ts` | Global state management (tasks, chat) |
| `src/components/TaskGrid.tsx` | Task management UI with animations |
| `src/components/ConfirmActionModal.tsx` | 5-second confirmation gates |
| `src/components/ActionLog.tsx` | AI decision audit trail |

---

## Assumptions

- The Hume AI EVI is configured with tools (`manage_burnout`, `add_task`) in the portal.
- The Gemini API key has access to `gemini-2.0-flash` model.
- Tasks are stored locally (Zustand + localStorage). Firebase is optional for historical persistence.
- The assistant operates as a single-page application — no authentication required.
- Voice features require microphone access and a modern browser (Chrome preferred).

---

## Testing the Assistant

### Voice
1. Click the 🎤 mic button in the input bar to start a voice session.
2. Say: *"Add buy groceries to my tasks"* or *"I finished the Chemistry Lab Report."*

### Text Chat
Type in the input bar:
- `"Add buy groceries to my tasks"` → Adds a task
- `"What do I still need to do?"` → Lists current tasks
- `"Mark task 1 as done"` → Completes the task
- `"Explain what machine learning is"` → Knowledge Q&A response

---

## Design Philosophy: Zen
- **Teal (#14B8A6)**: Calm/Productive state
- **Amber (#F59E0B)**: Warning/Elevated workload
- **Glassmorphism**: Translucent, layered UI for premium feel

---
Developed by the Aura-AI Team.
