'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAuraStore, Task } from '@/store/useAuraStore';
import { Clock, Calendar, AlertCircle, CheckCircle2, Circle } from 'lucide-react';

export const TaskGrid = () => {
    const tasks = useAuraStore((state) => state.tasks);

    const todayTasks = tasks.filter(t => t.day === 'today' && t.status !== 'completed');
    const tomorrowTasks = tasks.filter(t => t.day === 'tomorrow' && t.status !== 'completed');

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-5xl">
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

                <div className="space-y-4">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {todayTasks.length > 0 ? (
                            todayTasks.map((task) => (
                                <TaskCard key={task.id} task={task} />
                            ))
                        ) : (
                            <EmptyState message="All clear for today. You're doing great!" />
                        )}
                    </AnimatePresence>
                </div>
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

                <div className="space-y-4">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {tomorrowTasks.length > 0 ? (
                            tomorrowTasks.map((task) => (
                                <TaskCard key={task.id} task={task} />
                            ))
                        ) : (
                            <EmptyState message="No upcoming tasks. Rest up." />
                        )}
                    </AnimatePresence>
                </div>
            </section>
        </div>
    );
};

const TaskCard = ({ task }: { task: Task }) => {
    const postponeTask = useAuraStore((state) => state.postponeTask);

    const priorityColors = {
        high: 'bg-stressed',
        medium: 'bg-alert',
        low: 'bg-calm'
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{
                duration: 0.5,
                ease: [0.23, 1, 0.32, 1], // Custom cubic-bezier for snappy feel
                layout: { duration: 0.6, ease: [0.23, 1, 0.32, 1] }
            }}
            className="group relative p-5 rounded-[2rem] glass flex justify-between items-center border border-white/10 hover:border-white/20 transition-colors shadow-sm cursor-default"
        >
            <div className="flex items-center gap-4">
                <button
                    onClick={() => postponeTask(task.id)}
                    className="p-1 opacity-20 hover:opacity-100 transition-opacity hover:scale-110 active:scale-95"
                >
                    <Circle className="w-5 h-5" />
                </button>
                <div>
                    <h3 className="font-semibold text-lg tracking-tight group-hover:text-calm transition-colors leading-tight">
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

            {task.status === 'postponed' && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-alert/10 text-alert border border-alert/20">
                    <AlertCircle className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase">Auto-Moved</span>
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
        className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] text-center"
    >
        <p className="text-sm font-medium opacity-20 italic px-8">{message}</p>
    </motion.div>
);
