import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { isGoalDueToday, getTodayDateString } from '../utils/dateUtils';
import { Goal, GoalWithCompletion, CompletionStatus, GoalDifficulty, GoalPriority } from '../types';
import { CheckCircleIcon, ChevronDownIcon, PlusIcon, TrophyIcon, FlameIcon, CheckSquareIcon, DumbbellIcon, BrainIcon, AlertTriangleIcon } from '../components/Icons';
import { EXP_BY_DIFFICULTY } from '../constants';
import { playCompletionSound, playLevelUpSound } from '../utils/soundUtils';

const usePrevious = <T,>(value: T): T | undefined => {
    const ref = useRef<T | undefined>(undefined);
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
};


const CompletionModal: React.FC<{ goal: Goal, onConfirm: (goalId: string, note?: string) => void, onCancel: () => void }> = ({ goal, onConfirm, onCancel }) => {
    const [note, setNote] = useState('');
    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeInUp">
            <div className="bg-slate-900/80 backdrop-blur-2xl border border-violet-500/20 rounded-2xl p-6 w-full max-w-md m-4 shadow-2xl shadow-violet-500/10">
                <h3 className="text-lg font-bold text-cyan-300 mb-2">Complete Goal: {goal.title}</h3>
                <p className="text-sm text-slate-400 mb-4">Add an optional note to your goal archive.</p>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g., 'New personal best!'"
                    className="w-full h-24 p-2 border rounded-md bg-slate-800/50 border-slate-700 focus:ring-cyan-500 focus:border-cyan-500"
                ></textarea>
                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={onCancel} className="px-4 py-2 rounded-md text-sm font-medium border border-slate-600 hover:bg-slate-700/50">Cancel</button>
                    <button onClick={() => onConfirm(goal.id, note)} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-500">Complete</button>
                </div>
            </div>
        </div>
    );
};


const GoalItem: React.FC<{ goal: GoalWithCompletion, onCompleteClick: (goal: Goal) => void }> = ({ goal, onCompleteClick }) => {
    const isCompleted = goal.completion?.status === CompletionStatus.Completed;
    const wasJustCompleted = usePrevious(isCompleted) === false && isCompleted === true;
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (wasJustCompleted) {
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), 600); // match animation duration
            return () => clearTimeout(timer);
        }
    }, [wasJustCompleted]);
    
    const difficultyStyles: Record<GoalDifficulty, string> = {
        [GoalDifficulty.Easy]: 'text-green-400 border-green-400/50 bg-green-500/10',
        [GoalDifficulty.Medium]: 'text-yellow-400 border-yellow-400/50 bg-yellow-500/10',
        [GoalDifficulty.Hard]: 'text-red-400 border-red-400/50 bg-red-500/10',
    };

    const priorityStyles: Record<GoalPriority, string> = {
        [GoalPriority.Low]: 'text-sky-400 border-sky-400/50 bg-sky-500/10',
        [GoalPriority.Medium]: 'text-yellow-400 border-yellow-400/50 bg-yellow-500/10',
        [GoalPriority.High]: 'text-red-400 border-red-400/50 bg-red-500/10',
    };

    return (
        <div className={`p-4 rounded-lg flex items-center justify-between transition-all duration-300 border border-transparent ${isCompleted ? 'bg-green-500/10 ' : 'bg-slate-800/50 hover:bg-slate-800/80 hover:border-cyan-500/30 hover:-translate-y-0.5'} ${isAnimating ? 'animate-questComplete' : ''}`}>
            <div>
                <h3 className={`font-semibold text-slate-100 ${isCompleted ? 'line-through text-slate-500' : ''}`}>{goal.title}</h3>
                <p className={`text-sm text-slate-400 ${isCompleted ? 'line-through' : ''}`}>{goal.description}</p>
                 <div className="flex items-center mt-2">
                    <div className="flex items-center text-sm font-bold text-cyan-400 mr-4">
                        <PlusIcon className="w-4 h-4 mr-1" />
                        <span>{EXP_BY_DIFFICULTY[goal.difficulty]} EXP</span>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border capitalize ${difficultyStyles[goal.difficulty]}`}>
                        {goal.difficulty}
                    </span>
                    <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full border capitalize ${priorityStyles[goal.priority || GoalPriority.Medium]}`}>
                        {goal.priority || 'medium'}
                    </span>
                </div>
            </div>
            <button
                onClick={() => onCompleteClick(goal)}
                disabled={isCompleted}
                aria-label={`Complete goal: ${goal.title}`}
                className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 ${isCompleted ? 'bg-green-500 text-white scale-100 cursor-default' : 'bg-slate-700 text-slate-400 hover:bg-cyan-500 hover:text-white hover:scale-110'} ${isAnimating ? 'animate-checkmarkPop' : ''}`}
            >
                <CheckCircleIcon className="w-6 h-6" />
            </button>
        </div>
    );
}

const GoalSection: React.FC<{ title: string, goals: GoalWithCompletion[], onCompleteClick: (goal: Goal) => void }> = ({ title, goals, onCompleteClick }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (goals.length === 0) return null;

    return (
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-violet-500/20 rounded-2xl shadow-2xl shadow-violet-500/10 overflow-hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 bg-slate-900/30">
                <h2 className="text-xl font-bold font-display text-cyan-300">{title} ({goals.length})</h2>
                <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                 <div className="p-4 pt-2 space-y-3">
                    {goals.map(goal => (
                        <GoalItem 
                            key={goal.id} 
                            goal={goal} 
                            onCompleteClick={onCompleteClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

const StatCard: React.FC<{icon: React.ElementType, label: string, value: string | number, color?: string}> = ({ icon: Icon, label, value, color = 'text-cyan-300' }) => (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-violet-500/10 rounded-xl p-4 flex items-center">
        <Icon className={`w-8 h-8 mr-4 ${color}`} />
        <div>
            <div className="text-2xl font-bold font-display leading-tight">{value}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
        </div>
    </div>
);


const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const { userGoals, systemGoals, completions, completeGoal, loading, levelInfo, userStats } = useData();
    const [completingGoal, setCompletingGoal] = useState<Goal | null>(null);
    const [showLevelUp, setShowLevelUp] = useState(false);

    const prevLevel = usePrevious(levelInfo?.level);

    useEffect(() => {
        if (levelInfo && prevLevel && levelInfo.level > prevLevel) {
            setShowLevelUp(true);
            playLevelUpSound();
            const timer = setTimeout(() => setShowLevelUp(false), 2500);
            return () => clearTimeout(timer);
        }
    }, [levelInfo, prevLevel]);

    const today = getTodayDateString();

    const priorityOrder: Record<GoalPriority, number> = {
        [GoalPriority.High]: 1,
        [GoalPriority.Medium]: 2,
        [GoalPriority.Low]: 3,
    };

    const dueUserGoals: GoalWithCompletion[] = useMemo(() => {
        return userGoals
            .filter(isGoalDueToday)
            .map(goal => ({
                ...goal,
                completion: completions.find(c => c.taskId === goal.id && c.date === today)
            }))
            .sort((a,b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }, [userGoals, completions, today]);
    
    const dueSystemGoals: GoalWithCompletion[] = useMemo(() => {
        return systemGoals
            .filter(isGoalDueToday)
            .map(goal => ({
                ...goal,
                completion: completions.find(c => c.taskId === goal.id && c.date === today)
            }))
            .sort((a,b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }, [systemGoals, completions, today]);

    const handleConfirmComplete = async (goalId: string, note?: string) => {
        await completeGoal(goalId, note);
        setCompletingGoal(null);
        playCompletionSound();
    };

    const handleCompleteClick = (goal: Goal) => {
        // Sanitize the goal object to prevent circular reference errors
        // by creating a plain object with only the necessary properties.
        const plainGoal: Goal = {
            id: goal.id,
            userId: goal.userId,
            title: goal.title,
            description: goal.description,
            status: goal.status,
            scheduleType: goal.scheduleType,
            weekdays: goal.weekdays,
            createdAt: goal.createdAt,
            difficulty: goal.difficulty,
            priority: goal.priority,
            type: goal.type,
            category: goal.category,
        };
        setCompletingGoal(plainGoal);
    };

    if (loading || !levelInfo || !userStats) {
        return <div className="text-center p-10 font-display text-cyan-400">Loading Status...</div>;
    }

    return (
        <div className="space-y-8 relative">
            {completingGoal && <CompletionModal goal={completingGoal} onConfirm={handleConfirmComplete} onCancel={() => setCompletingGoal(null)} />}
            
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

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard icon={CheckSquareIcon} label="Total Goals Completed" value={userStats.totalGoalsCompleted} />
                <StatCard icon={FlameIcon} label="Current Streak" value={`${userStats.currentStreak} days`} color="text-orange-400"/>
                <StatCard icon={TrophyIcon} label="Longest Streak" value={`${userStats.longestStreak} days`} color="text-yellow-400"/>
                <StatCard icon={DumbbellIcon} label="Physical Goals" value={userStats.physicalGoalsCompleted} />
                <StatCard icon={BrainIcon} label="Mental Goals" value={userStats.mentalGoalsCompleted} />
                <StatCard icon={AlertTriangleIcon} label="Hard Goals" value={userStats.hardGoalsCompleted} color="text-red-400"/>
            </div>
            
            <div className="space-y-6">
                <GoalSection title="Daily Goals" goals={dueUserGoals} onCompleteClick={handleCompleteClick} />
                <GoalSection title="System Goals" goals={dueSystemGoals} onCompleteClick={handleCompleteClick} />

                {dueUserGoals.length === 0 && dueSystemGoals.length === 0 && (
                     <div className="text-center py-10 bg-slate-900/60 backdrop-blur-2xl border border-violet-500/20 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-semibold text-slate-300">No active goals.</h3>
                        <p className="text-slate-400">A true player is never idle. Add a new goal.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;