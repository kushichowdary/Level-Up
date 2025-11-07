import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { isTaskDueToday, getTodayDateString } from '../utils/dateUtils';
import { Task, TaskWithCompletion, CompletionStatus, TaskDifficulty, TaskPriority } from '../types';
import { CheckCircleIcon, ChevronDownIcon, PlusIcon } from '../components/Icons';
import { EXP_BY_DIFFICULTY } from '../constants';
import { playCompletionSound } from '../utils/soundUtils';

const usePrevious = <T,>(value: T): T | undefined => {
    // FIX: Explicitly provide an initial value to `useRef` to fix the "Expected 1 arguments, but got 0" error.
    const ref = useRef<T | undefined>(undefined);
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
};


const CompletionModal: React.FC<{ task: Task, onConfirm: (taskId: string, note?: string) => void, onCancel: () => void }> = ({ task, onConfirm, onCancel }) => {
    const [note, setNote] = useState('');
    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeInUp">
            <div className="bg-slate-900/80 backdrop-blur-2xl border border-violet-500/20 rounded-2xl p-6 w-full max-w-md m-4 shadow-2xl shadow-violet-500/10">
                <h3 className="text-lg font-bold text-cyan-300 mb-2">Complete Quest: {task.title}</h3>
                <p className="text-sm text-slate-400 mb-4">Add an optional note to your quest log.</p>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g., 'New personal best!'"
                    className="w-full h-24 p-2 border rounded-md bg-slate-800/50 border-slate-700 focus:ring-cyan-500 focus:border-cyan-500"
                ></textarea>
                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={onCancel} className="px-4 py-2 rounded-md text-sm font-medium border border-slate-600 hover:bg-slate-700/50">Cancel</button>
                    <button onClick={() => onConfirm(task.id, note)} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-500">Complete</button>
                </div>
            </div>
        </div>
    );
};


const QuestItem: React.FC<{ task: TaskWithCompletion, onCompleteClick: (task: Task) => void }> = ({ task, onCompleteClick }) => {
    const isCompleted = task.completion?.status === CompletionStatus.Completed;
    const wasJustCompleted = usePrevious(isCompleted) === false && isCompleted === true;
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (wasJustCompleted) {
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), 600); // match animation duration
            return () => clearTimeout(timer);
        }
    }, [wasJustCompleted]);
    
    const difficultyStyles: Record<TaskDifficulty, string> = {
        [TaskDifficulty.Easy]: 'text-green-400 border-green-400/50 bg-green-500/10',
        [TaskDifficulty.Medium]: 'text-yellow-400 border-yellow-400/50 bg-yellow-500/10',
        [TaskDifficulty.Hard]: 'text-red-400 border-red-400/50 bg-red-500/10',
    };

    const priorityStyles: Record<TaskPriority, string> = {
        [TaskPriority.Low]: 'text-sky-400 border-sky-400/50 bg-sky-500/10',
        [TaskPriority.Medium]: 'text-yellow-400 border-yellow-400/50 bg-yellow-500/10',
        [TaskPriority.High]: 'text-red-400 border-red-400/50 bg-red-500/10',
    };

    return (
        <div className={`p-4 rounded-lg flex items-center justify-between transition-all duration-300 border border-transparent ${isCompleted ? 'bg-green-500/10 ' : 'bg-slate-800/50 hover:bg-slate-800/80 hover:border-cyan-500/30 hover:-translate-y-0.5'} ${isAnimating ? 'animate-questComplete' : ''}`}>
            <div>
                <h3 className={`font-semibold text-slate-100 ${isCompleted ? 'line-through text-slate-500' : ''}`}>{task.title}</h3>
                <p className={`text-sm text-slate-400 ${isCompleted ? 'line-through' : ''}`}>{task.description}</p>
                 <div className="flex items-center mt-2">
                    <div className="flex items-center text-sm font-bold text-cyan-400 mr-4">
                        <PlusIcon className="w-4 h-4 mr-1" />
                        <span>{EXP_BY_DIFFICULTY[task.difficulty]} EXP</span>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border capitalize ${difficultyStyles[task.difficulty]}`}>
                        {task.difficulty}
                    </span>
                    <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full border capitalize ${priorityStyles[task.priority || TaskPriority.Medium]}`}>
                        {task.priority || 'medium'}
                    </span>
                </div>
            </div>
            <button
                onClick={() => onCompleteClick(task)}
                disabled={isCompleted}
                aria-label={`Complete quest: ${task.title}`}
                className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 ${isCompleted ? 'bg-green-500 text-white scale-100 cursor-default' : 'bg-slate-700 text-slate-400 hover:bg-cyan-500 hover:text-white hover:scale-110'} ${isAnimating ? 'animate-checkmarkPop' : ''}`}
            >
                <CheckCircleIcon className="w-6 h-6" />
            </button>
        </div>
    );
}

const QuestSection: React.FC<{ title: string, quests: TaskWithCompletion[], onCompleteClick: (task: Task) => void }> = ({ title, quests, onCompleteClick }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (quests.length === 0) return null;

    return (
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-violet-500/20 rounded-2xl shadow-2xl shadow-violet-500/10 overflow-hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 bg-slate-900/30">
                <h2 className="text-xl font-bold font-display text-cyan-300">{title} ({quests.length})</h2>
                <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                 <div className="p-4 pt-2 space-y-3">
                    {quests.map(task => (
                        <QuestItem 
                            key={task.id} 
                            task={task} 
                            onCompleteClick={onCompleteClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const { userTasks, systemQuests, completions, completeTask, loading, levelInfo } = useData();
    const [completingTask, setCompletingTask] = useState<Task | null>(null);
    const [showLevelUp, setShowLevelUp] = useState(false);

    const prevLevel = usePrevious(levelInfo?.level);

    useEffect(() => {
        if (levelInfo && prevLevel && levelInfo.level > prevLevel) {
            setShowLevelUp(true);
            const timer = setTimeout(() => setShowLevelUp(false), 2500);
            return () => clearTimeout(timer);
        }
    }, [levelInfo, prevLevel]);

    const today = getTodayDateString();

    const priorityOrder: Record<TaskPriority, number> = {
        [TaskPriority.High]: 1,
        [TaskPriority.Medium]: 2,
        [TaskPriority.Low]: 3,
    };

    const dueUserQuests: TaskWithCompletion[] = useMemo(() => {
        return userTasks
            .filter(isTaskDueToday)
            .map(task => ({
                ...task,
                completion: completions.find(c => c.taskId === task.id && c.date === today)
            }))
            .sort((a,b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }, [userTasks, completions, today]);
    
    const dueSystemQuests: TaskWithCompletion[] = useMemo(() => {
        return systemQuests
            .filter(isTaskDueToday)
            .map(task => ({
                ...task,
                completion: completions.find(c => c.taskId === task.id && c.date === today)
            }))
            .sort((a,b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }, [systemQuests, completions, today]);

    const handleConfirmComplete = async (taskId: string, note?: string) => {
        await completeTask(taskId, note);
        setCompletingTask(null);
        playCompletionSound();
    };

    if (loading || !levelInfo) {
        return <div className="text-center p-10 font-display text-cyan-400">Loading Status...</div>;
    }

    return (
        <div className="space-y-8 relative">
            {completingTask && <CompletionModal task={completingTask} onConfirm={handleConfirmComplete} onCancel={() => setCompletingTask(null)} />}
            
            {showLevelUp && (
                 <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                    <h1 className="text-8xl font-display font-black text-yellow-300 animate-levelUp" style={{ WebkitTextStroke: '2px black' }}>
                        LEVEL UP!
                    </h1>
                </div>
            )}

            <header>
                <h1 className="text-3xl font-bold font-display text-slate-100">Status Window</h1>
                <p className="text-slate-400">Welcome, Player {user?.name}.</p>
            </header>

            <div className="bg-slate-900/60 backdrop-blur-2xl border border-violet-500/20 p-5 rounded-2xl shadow-2xl shadow-violet-500/10">
                <div className="flex justify-between items-center mb-4">
                    <div className="relative w-28 h-32 flex items-center justify-center flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 to-violet-700 opacity-50" style={{clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'}}></div>
                        <div className="absolute inset-1 bg-slate-900" style={{clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'}}></div>
                        <div className="relative font-display text-center">
                            <span className="block text-slate-400 text-xs tracking-widest">LEVEL</span>
                            <span className="block text-5xl font-bold text-cyan-300 leading-tight animate-glow">{levelInfo.level}</span>
                        </div>
                    </div>

                    <div className="w-full pl-6">
                        <div className="text-right mb-1">
                            <p className="text-sm font-semibold text-slate-200">{levelInfo.currentLevelExp.toLocaleString()} / {levelInfo.expToNextLevel.toLocaleString()} EXP</p>
                            <p className="text-xs text-slate-400">Total: {levelInfo.totalExp.toLocaleString()} EXP</p>
                        </div>
                        <div className="w-full bg-slate-800/50 rounded-full h-4 border border-slate-700 overflow-hidden">
                            <div 
                                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-500 ease-out relative" 
                                style={{ width: `${levelInfo.progressPercentage}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-shimmer" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="space-y-6">
                <QuestSection title="Daily Quests" quests={dueUserQuests} onCompleteClick={setCompletingTask} />
                <QuestSection title="System Quests" quests={dueSystemQuests} onCompleteClick={setCompletingTask} />

                {dueUserQuests.length === 0 && dueSystemQuests.length === 0 && (
                     <div className="text-center py-10 bg-slate-900/60 backdrop-blur-2xl border border-violet-500/20 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-semibold text-slate-300">No active quests.</h3>
                        <p className="text-slate-400">A true player is never idle. Add a new quest.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;