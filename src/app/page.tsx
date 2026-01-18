'use client';

import { AuraSphere } from '@/components/AuraSphere';
import { TaskGrid } from '@/components/TaskGrid';
import { VoiceController } from '@/components/VoiceController';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { useFirebaseSync } from '@/hooks/useFirebase';

export default function Home() {
  // Sync state with Firebase (if configured)
  useFirebaseSync();

  return (
    <main className="flex flex-col items-center justify-between p-8 md:p-24 min-h-screen">
      {/* Header */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Aura AI</h1>
          <p className="opacity-50">Your Empathetic Productivity Partner</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-calm/20 flex items-center justify-center animate-pulse">
          <div className="h-2 w-2 rounded-full bg-calm" />
        </div>
      </div>

      {/* Hero Section - Aura Sphere */}
      <div className="flex-1 flex items-center justify-center py-20">
        <AuraSphere />
      </div>

      {/* Tasks Section */}
      <TaskGrid />

      {/* Analytics Section */}
      <AnalyticsDashboard />

      {/* Voice Layer Overlay */}
      <VoiceController />

      {/* Footer / Interaction Hint */}
      <div className="mt-20 text-center opacity-30 text-sm">
        <p>Start a session to begin your empathetic interaction</p>
      </div>
    </main>
  );
}
