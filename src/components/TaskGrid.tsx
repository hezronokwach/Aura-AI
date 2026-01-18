'use client';

import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useAuraStore, Task } from '@/store/useAuraStore';
import { Clock, Calendar, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { useEffect } from 'react';

export const TaskGrid = () => {
    const tasks = useAuraStore((state) => state.tasks);

    useEffect(() => {
        console.log('TaskGrid state update:', tasks);
        // Expose a global move command for the user to debug animations
        (window as any).auraMoveTask = (id: string) => {
            console.log(`Debug: Manually moving task ${id}`);
            useAuraStore.getState().manageBurnout(id, 'postpone');
        };
    }, [tasks]);

    const todayTasks = tasks.filter(t => t.day === 'today' && t.status !== 'completed');
    const tomorrowTasks = tasks.filter(t => t.day === 'tomorrow' && t.status !== 'completed');

    return (
        <LayoutGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
                {/* Today Section */}
                <section className="flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-calm/10">
                                <Clock className="w-5 h-5 text-calm" />
                            </div>
                            <h2 className="text-xl font-bold tracking-tight">Today's Focus</h2>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest opacity-30">
                            {todayTasks.length} {todayTasks.length === 1 ? 'Task' : 'Tasks'}
                        </span>
                    </div>

                    <motion.div layout className="space-y-4 min-h-[100px]">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {todayTasks.length > 0 ? (
                                todayTasks.map((task) => (
                                    <TaskCard key={task.id} task={task} />
                                ))
                            ) : (
                                <EmptyState key="today-empty" message="All clear for today. You're doing great!" />
                            )}
                        </AnimatePresence>
                    </motion.div>
                </section>

                {/* Tomorrow Section */}
                <section className="flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3 opacity-60">
                            <div className="p-2 rounded-xl bg-slate-500/10">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold tracking-tight">Upcoming</h2>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest opacity-20">
                            {tomorrowTasks.length} {tomorrowTasks.length === 1 ? 'Task' : 'Tasks'}
                        </span>
                    </div>

                    <motion.div layout className="space-y-4 min-h-[100px]">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {tomorrowTasks.length > 0 ? (
                                tomorrowTasks.map((task) => (
                                    <TaskCard key={task.id} task={task} />
                                ))
                            ) : (
                                <EmptyState key="tomorrow-empty" message="No upcoming tasks. Rest up." />
                            )}
                        </AnimatePresence>
                    </motion.div>
                </section>
            </div>
        </LayoutGroup>
    );
};

const TaskCard = ({ task }: { task: Task }) => {
    const postponeTask = useAuraStore((state) => state.postponeTask);

    const priorityColors = {
        high: 'bg-stressed',
        medium: 'bg-alert',
        low: 'bg-calm'
    };

    const statusConfig = {
        postponed: { label: 'Auto-Moved', color: 'bg-alert/10 text-alert border-alert/20', icon: <AlertCircle className="w-3 h-3" /> },
        cancelled: { label: 'Cancelled', color: 'bg-stressed/10 text-stressed border-stressed/20', icon: <Circle className="w-3 h-3 fill-current" /> },
        delegated: { label: 'Delegated', color: 'bg-calm/10 text-calm border-calm/20', icon: <CheckCircle2 className="w-3 h-3" /> },
    };

    const config = (task.status !== 'pending' && task.status !== 'completed')
        ? statusConfig[task.status as keyof typeof statusConfig]
        : null;

    return (
        <motion.div
            layout
            layoutId={task.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{
                duration: 0.5,
                ease: [0.23, 1, 0.32, 1], // Custom cubic-bezier for snappy feel
                layout: { duration: 0.6, ease: [0.23, 1, 0.32, 1] }
            }}
            className={`group relative p-3.5 rounded-[1.25rem] glass flex justify-between items-center border border-white/10 hover:border-white/20 transition-colors shadow-sm cursor-default ${task.status === 'cancelled' ? 'opacity-40 grayscale' : ''
                }`}
        >
            <div className="flex items-center gap-4">
                <button
                    onClick={() => postponeTask(task.id)}
                    disabled={task.status !== 'pending'}
                    className={`p-1 transition-opacity ${task.status === 'pending' ? 'opacity-20 hover:opacity-100 hover:scale-110 active:scale-95' : 'opacity-0 pointer-events-none'
                        }`}
                >
                    <Circle className="w-5 h-5" />
                </button>
                <div>
                    <h3 className={`font-semibold text-base tracking-tight group-hover:text-calm transition-colors leading-tight ${task.status === 'cancelled' ? 'line-through' : ''
                        }`}>
                        {task.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5">
                        <span className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                            {task.priority} Priority
                        </span>
                    </div>
                </div>
            </div>

            {config && (
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${config.color}`}>
                    {config.icon}
                    <span className="text-[9px] font-black uppercase">{config.label}</span>
                </div>
            )}
        </motion.div>
    );
};

const EmptyState = ({ message }: { message: string }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem] text-center"
    >
        <p className="text-sm font-medium opacity-20 italic px-8">{message}</p>
    </motion.div>
);
