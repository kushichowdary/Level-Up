import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useNotification } from '../contexts/NotificationContext';
import { Goal, GoalStatus, ScheduleType, GoalDifficulty, GoalPriority } from '../types';
import { PlusIcon } from '../components/Icons';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type NewGoalData = Omit<Goal, 'id' | 'createdAt' | 'userId'>;

const GoalForm: React.FC<{ goal?: Goal; onSave: (goal: NewGoalData | Goal) => void; onCancel: () => void }> = ({ goal, onSave, onCancel }) => {
    const [title, setTitle] = useState(goal?.title || '');
    const [description, setDescription] = useState(goal?.description || '');
    const [scheduleType, setScheduleType] = useState<ScheduleType>(goal?.scheduleType || ScheduleType.Daily);
    const [weekdays, setWeekdays] = useState<number[]>(goal?.weekdays || []);
    const [difficulty, setDifficulty] = useState<GoalDifficulty>(goal?.difficulty || GoalDifficulty.Easy);
    const [priority, setPriority] = useState<GoalPriority>(goal?.priority || GoalPriority.Medium);

    const handleWeekdayToggle = (dayIndex: number) => {
        setWeekdays(prev => prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const goalData = {
            ...goal,
            title,
            description,
            scheduleType,
            weekdays: scheduleType === ScheduleType.Weekly ? weekdays : [],
            status: goal?.status || GoalStatus.Active,
            difficulty,
            priority,
        };
        onSave(goalData);
    };
    
    const inputClass = "mt-1 block w-full rounded-md border-slate-700 bg-slate-800/30 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm capitalize";

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-slate-900/60 backdrop-blur-2xl border border-violet-500/20 rounded-2xl shadow-2xl shadow-violet-500/10 space-y-4 animate-fadeInUp">
            <h3 className="text-lg font-bold font-display text-cyan-300">{goal ? 'Edit Goal' : 'Create New Goal'}</h3>
            <div>
                <label className="block text-sm font-medium text-slate-300">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className={inputClass} />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className={inputClass} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300">Schedule</label>
                    <select value={scheduleType} onChange={e => setScheduleType(e.target.value as ScheduleType)} className={inputClass}>
                        <option value={ScheduleType.Daily}>Daily</option>
                        <option value={ScheduleType.Weekly}>Specific days of the week</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300">Difficulty</label>
                    <select value={difficulty} onChange={e => setDifficulty(e.target.value as GoalDifficulty)} className={inputClass}>
                        <option value={GoalDifficulty.Easy}>Easy</option>
                        <option value={GoalDifficulty.Medium}>Medium</option>
                        <option value={GoalDifficulty.Hard}>Hard</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300">Priority</label>
                    <select value={priority} onChange={e => setPriority(e.target.value as GoalPriority)} className={inputClass}>
                        <option value={GoalPriority.Low}>Low</option>
                        <option value={GoalPriority.Medium}>Medium</option>
                        <option value={GoalPriority.High}>High</option>
                    </select>
                </div>
            </div>
            {scheduleType === ScheduleType.Weekly && (
                <div>
                     <label className="block text-sm font-medium text-slate-300 mb-2">Select Days</label>
                    <div className="flex flex-wrap gap-2">
                        {WEEKDAYS.map((day, index) => (
                            <button
                                type="button"
                                key={day}
                                onClick={() => handleWeekdayToggle(index)}
                                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${weekdays.includes(index) ? 'bg-cyan-500 text-white shadow-md' : 'bg-slate-700 hover:bg-slate-600'}`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md text-sm font-medium border border-slate-600 hover:bg-slate-700/50">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-500/10">Save Goal</button>
            </div>
        </form>
    );
};


const GoalsPage: React.FC = () => {
    const { userGoals, addGoal, updateGoal, deleteGoal } = useData();
    const { addNotification } = useNotification();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);
    
    const handleSave = async (goalData: NewGoalData | Goal) => {
        const isEditing = 'id' in goalData && goalData.id;
        if(isEditing) {
            await updateGoal(goalData as Goal);
        } else {
            await addGoal(goalData as NewGoalData);
        }
        addNotification(
            'Quest Log Updated',
            `'${goalData.title}' has been ${isEditing ? 'updated' : 'added'}.`,
            'info'
        );
        setIsFormOpen(false);
        setEditingGoal(undefined);
    }
    
    const handleEdit = (goal: Goal) => {
        setEditingGoal(goal);
        setIsFormOpen(true);
    }

    const handleAddNew = () => {
        setEditingGoal(undefined);
        setIsFormOpen(true);
    };

    const priorityOrder: Record<GoalPriority, number> = {
        [GoalPriority.High]: 1,
        [GoalPriority.Medium]: 2,
        [GoalPriority.Low]: 3,
    };

    const sortedUserGoals = [...userGoals].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    const difficultyColors: Record<GoalDifficulty, string> = {
        [GoalDifficulty.Easy]: 'text-green-400',
        [GoalDifficulty.Medium]: 'text-yellow-400',
        [GoalDifficulty.Hard]: 'text-red-400',
    };

    const priorityColors: Record<GoalPriority, string> = {
        [GoalPriority.Low]: 'text-sky-400',
        [GoalPriority.Medium]: 'text-yellow-400',
        [GoalPriority.High]: 'text-red-400',
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold font-display text-slate-100">Manage Daily Goals</h1>
                <button onClick={handleAddNew} className="flex items-center px-5 py-2 bg-gradient-to-r from-cyan-600 to-violet-600 text-white rounded-lg font-semibold hover:opacity-90 shadow-lg shadow-cyan-500/10 transition-all transform hover:scale-105">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add New Goal
                </button>
            </div>

            {isFormOpen && <GoalForm goal={editingGoal} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />}

            <div className="space-y-4">
                {sortedUserGoals.length === 0 && !isFormOpen && (
                    <div className="text-center py-16 bg-slate-900/60 backdrop-blur-2xl border border-violet-500/20 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-semibold text-slate-300">No Daily Goals defined.</h3>
                        <p className="text-slate-400">Click 'Add New Goal' to create your custom challenges.</p>
                    </div>
                )}
                {sortedUserGoals.map(goal => (
                    <div key={goal.id} className="p-4 bg-slate-900/60 backdrop-blur-xl border border-violet-500/10 rounded-xl shadow-lg flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-slate-100">{goal.title}</h3>
                            <p className="text-sm text-slate-400">{goal.description}</p>
                            <div className="flex items-center text-xs mt-2 text-slate-500 capitalize">
                               <span>{goal.scheduleType === 'weekly' ? goal.weekdays.map(d => WEEKDAYS[d]).join(', ') : 'Daily'}</span>
                               <span className="mx-2">|</span>
                               <span className={difficultyColors[goal.difficulty]}>{goal.difficulty}</span>
                               <span className="mx-2">|</span>
                               <span className={priorityColors[goal.priority || GoalPriority.Medium]}>{goal.priority || 'medium'}</span>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => handleEdit(goal)} className="px-3 py-1 text-sm font-medium text-cyan-400 rounded-md hover:bg-cyan-500/20">Edit</button>
                            <button onClick={() => deleteGoal(goal.id)} className="px-3 py-1 text-sm font-medium text-red-400 rounded-md hover:bg-red-500/20">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GoalsPage;