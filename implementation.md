This is the "Ground Truth" engineering document for **Aura AI**. It covers everything from the folder structure to the specific logic that prevents this from being "just a chatbot."

---

## 🏗️ 1. File Structure (Next.js 15 + App Router)

This structure ensures that your **Voice logic**, **UI State**, and **Data fetching** are separated so you don't get "spaghetti code."

```text
/aura-ai
├── /app
│   ├── layout.tsx         # Hume VoiceProvider & UI Context
│   ├── page.tsx           # The "Aura" (Student/Human Interaction View)
│   ├── dashboard/
│   │   └── page.tsx       # The "Burnout Analytics" View
│   └── api/
│       └── hume/route.ts  # Generates Access Tokens for Hume
├── /components
│   ├── AuraSphere.tsx     # Animated sphere (Framer Motion)
│   ├── TaskGrid.tsx       # The Calendar/Task list with 'layout' prop
│   ├── StressChart.tsx    # Recharts line graph
│   └── VoiceController.tsx# Component that handles microphone & tool calls
├── /hooks
│   ├── useHumeHandler.ts  # Logic to calculate stress & update state
│   └── useFirebase.ts     # Firestore write/read logic
├── /store
│   └── useAuraStore.ts    # Zustand state (stressScore, tasksArray)
├── /lib
│   ├── firebase.ts        # Firebase Client SDK config
│   └── utils.ts           # Tailwind merge & stress formula
└── /constants
    └── mockTasks.ts       # Initial JSON data for the demo

```

---

## 🌊 2. Data Flow Workflow

This is how a single word from the user turns into a graph and a moved task.

1. **Input:** User says, *"I'm so overwhelmed."*
2. **Hume WebSocket:** Streams back a `prosody` object containing emotion scores.
3. **Processing (`useHumeHandler`):**
* Extracts `Distress`, `Anxiety`, `Tiredness`.
* Calculates .
* Updates the **Zustand Store** `stressScore`.


4. **UI Reaction (Immediate):**
* **AuraSphere** reads the score  Changes color to Red.
* **StressChart** receives a new point  The line moves up.


5. **Agentic Action (Tool Call):**
* If , Hume sends a `tool_call` for `manage_burnout`.
* **Zustand Store** filters the `tasksArray`  Changes `status` of low-priority tasks to "Postponed".
* **TaskGrid** detects the state change  Framer Motion slides the blocks to the "Upcoming" column.


6. **Persistence:** Firebase saves the session every 2 seconds for historical viewing.

---

## 🛠️ 3. Setup & Integration Steps

### Step A: Hume AI Configuration (The Brain)

1. **Portal:** Go to the [Hume Portal](https://beta.hume.ai/).
2. **EVI Config:** Create a new configuration.
3. **System Prompt:** > "You are Aura, an empathic assistant. You protect the user's energy. You have access to their task list. If they sound stressed, use the 'manage_burnout' tool to reschedule their low-priority tasks."
4. **Tools:** Add a tool named `manage_burnout`.
* **Description:** Use this to move a task to tomorrow when the user is stressed.
* **Parameters:** `task_id` (string).



### Step B: The "Magic" Zustand Store (The Connective Tissue)

This is the most important file in your repo.

```typescript
// store/useAuraStore.ts
export const useAuraStore = create((set) => ({
  stressScore: 0,
  tasks: [
    { id: '1', title: 'Chemistry Lab', priority: 'high', day: 'today' },
    { id: '2', title: 'Social Mixer', priority: 'low', day: 'today' },
  ],
  setStressScore: (score) => set({ stressScore: score }),
  postponeTask: (id) => set((state) => ({
    tasks: state.tasks.map(t => t.id === id ? { ...t, day: 'tomorrow' } : t)
  })),
}));

```

### Step C: The Animation (The "Wow" Factor)

In your `TaskGrid.tsx`, use the `layout` prop. This is what makes it look like a "program" and not a "website."

```jsx
<motion.div layout className="grid grid-cols-2 gap-4">
  {tasks.map(task => (
    <motion.div
      layout // This makes the block slide automatically when its position in the array changes!
      key={task.id}
      className="p-4 bg-white rounded-xl shadow-lg"
    >
      {task.title}
    </motion.div>
  ))}
</motion.div>

```

---

## 🚀 4. Critical "Don't Neglect" List

* **Environmental Variables:** Do not hardcode your Hume API Key or Firebase config. Use a `.env.local` file. Vercel makes it easy to add these during deployment.
* **The "Mock" Reality:** For a hackathon, don't waste 5 hours on Google Calendar OAuth. Use the `mockTasks.ts` file. Judges care about the **Interaction**, not the OAuth login.
* **Latency:** Ensure you are using the `VoiceProvider` from the Hume SDK at the top level of your app so the connection stays open.
* **Mobile Responsiveness:** Judges often look at demos on tablets or phones. Use Tailwind's `md:` and `lg:` classes to make sure the Aura sphere and the Calendar don't overlap.

---

## 🏁 Final Demo Workflow

1. **Open Dashboard:** Show the empty graph.
2. **Start Aura Voice:** Say, *"Hey Aura, I'm feeling really good today."* (Sphere is Teal, low stress).
3. **The Pivot:** Suddenly act stressed. *"Actually, I just realized I have 40 pages to read and a meeting in 10 minutes!"*
4. **The Intervention:** Hume detects the shift  Sphere pulses Red  AI speaks  **Task slides across the screen.**
5. **The Conclusion:** Refresh the Dashboard to show the "Intervention Point."

**Would you like me to generate the `VoiceController.tsx` file which is the actual "Bridge" component that catches the Hume tool call and updates the Zustand store?**