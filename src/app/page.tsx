'use client';

import { UnifiedChat } from '@/components/UnifiedChat';
import { TaskGrid } from '@/components/TaskGrid';
import { FeedbackToast } from '@/components/FeedbackToast';
import { ActionLog } from '@/components/ActionLog';
import { ConfirmActionModal } from '@/components/ConfirmActionModal';
import { useFirebaseSync } from '@/hooks/useFirebase';
import { useAuraStore } from '@/store/useAuraStore';
import { BackgroundGradientAnimation } from '@/components/aceternity/background-gradient-animation';
import { GridPattern } from '@/components/aceternity/grid-pattern';

export default function Home() {
  useFirebaseSync();
  const pendingAction = useAuraStore((state) => state.pendingAction);
  const executePendingAction = useAuraStore((state) => state.executePendingAction);
  const clearPendingAction = useAuraStore((state) => state.clearPendingAction);

  return (
    <>
      {/* Animated Background */}
      <BackgroundGradientAnimation
        gradientBackgroundStart="rgb(2, 6, 23)"
        gradientBackgroundEnd="rgb(15, 23, 42)"
        firstColor="20, 184, 166"
        secondColor="245, 158, 11"
        thirdColor="225, 29, 72"
        fourthColor="100, 116, 139"
        fifthColor="45, 212, 191"
        pointerColor="20, 184, 166"
        size="80%"
        blendingValue="hard-light"
        interactive={false}
        containerClassName="fixed inset-0 -z-20"
      />
      <GridPattern
        width={40}
        height={40}
        className="fixed inset-0 -z-10 opacity-20"
        strokeDasharray="4 4"
      />

      <main className="h-screen bg-transparent text-slate-50 flex flex-col relative z-0">
        <FeedbackToast />

        {pendingAction && (
          <ConfirmActionModal
            taskName={pendingAction.taskName}
            actionType={pendingAction.actionType}
            onConfirm={executePendingAction}
            onCancel={clearPendingAction}
          />
        )}

        {/* Header */}
        <header className="flex-none w-full border-b border-white/5 bg-slate-950/50 backdrop-blur-xl z-50">
          <div className="max-w-[1400px] mx-auto px-6 h-16 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                <img src="/logo.png" alt="Aura Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Aura AI</h1>
                <p className="text-[9px] uppercase tracking-widest opacity-40 font-bold">Empathic Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium opacity-40">
              <span>v1.0.0</span>
              <div className="w-px h-4 bg-white/10" />
              <span className="uppercase tracking-widest">System Optimal</span>
            </div>
          </div>
        </header>

        {/* Main Content: Chat + Sidebar */}
        <div className="flex-1 flex max-w-[1400px] mx-auto w-full overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0">
            <UnifiedChat />
          </div>

          {/* Right Sidebar: Tasks + Action Log */}
          <aside className="hidden lg:flex lg:w-[380px] flex-col gap-4 border-l border-white/5 overflow-y-auto p-5 scrollbar-thin">
            <TaskGrid />
            <ActionLog />
          </aside>
        </div>
      </main>
    </>
  );
}
