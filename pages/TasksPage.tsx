import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Task, TaskStatus, ScheduleType, TaskDifficulty, TaskPriority } from '../types';
import { PlusIcon } from '../components/Icons';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type NewTaskData = Omit<Task, 'id' | 'createdAt' | 'userId'>;

const QuestForm: React.FC<{ task?: Task; onSave: (task: NewTaskData | Task) => void; onCancel: () => void }> = ({ task, onSave, onCancel }) => {
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [scheduleType, setScheduleType] = useState<ScheduleType>(task?.scheduleType || ScheduleType.Daily);
    const [weekdays, setWeekdays] = useState<number[]>(task?.weekdays || []);
    const [difficulty, setDifficulty] = useState<TaskDifficulty>(task?.difficulty || TaskDifficulty.Easy);
    const [priority, setPriority] = useState<TaskPriority>(task?.priority || TaskPriority.Medium);

    const handleWeekdayToggle = (dayIndex: number) => {
        setWeekdays(prev => prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const taskData = {
            ...task,
            title,
            description,
            scheduleType,
            weekdays: scheduleType === ScheduleType.Weekly ? weekdays : [],
            status: task?.status || TaskStatus.Active,
            difficulty,
            priority,
        };
        onSave(taskData);
    };
    
    const inputClass = "mt-1 block w-full rounded-md border-slate-700 bg-slate-800/30 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm capitalize";

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-slate-900/60 backdrop-blur-2xl border border-violet-500/20 rounded-2xl shadow-2xl shadow-violet-500/10 space-y-4 animate-fadeInUp">
            <h3 className="text-lg font-bold font-display text-cyan-300">{task ? 'Edit Quest' : 'Create New Quest'}</h3>
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
                    <select value={difficulty} onChange={e => setDifficulty(e.target.value as TaskDifficulty)} className={inputClass}>
                        <option value={TaskDifficulty.Easy}>Easy</option>
                        <option value={TaskDifficulty.Medium}>Medium</option>
                        <option value={TaskDifficulty.Hard}>Hard</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300">Priority</label>
                    <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className={inputClass}>
                        <option value={TaskPriority.Low}>Low</option>
                        <option value={TaskPriority.Medium}>Medium</option>
                        <option value={TaskPriority.High}>High</option>
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
                <button type="submit" className="px-4 py-2 rounded-md text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-500/10">Save Quest</button>
            </div>
        </form>
    );
};


const TasksPage: React.FC = () => {
    const { userTasks, addTask, updateTask, deleteTask } = useData();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
    
    const handleSave = async (taskData: NewTaskData | Task) => {
        if('id' in taskData && taskData.id) {
            await updateTask(taskData as Task);
        } else {
            await addTask(taskData as NewTaskData);
        }
        setIsFormOpen(false);
        setEditingTask(undefined);
    }
    
    const handleEdit = (task: Task) => {
        setEditingTask(task);
        setIsFormOpen(true);
    }

    const handleAddNew = () => {
        setEditingTask(undefined);
        setIsFormOpen(true);
    };

    const priorityOrder: Record<TaskPriority, number> = {
        [TaskPriority.High]: 1,
        [TaskPriority.Medium]: 2,
        [TaskPriority.Low]: 3,
    };

    const sortedUserTasks = [...userTasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    const difficultyColors: Record<TaskDifficulty, string> = {
        [TaskDifficulty.Easy]: 'text-green-400',
        [TaskDifficulty.Medium]: 'text-yellow-400',
        [TaskDifficulty.Hard]: 'text-red-400',
    };

    const priorityColors: Record<TaskPriority, string> = {
        [TaskPriority.Low]: 'text-sky-400',
        [TaskPriority.Medium]: 'text-yellow-400',
        [TaskPriority.High]: 'text-red-400',
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold font-display text-slate-100">Manage Daily Quests</h1>
                <button onClick={handleAddNew} className="flex items-center px-5 py-2 bg-gradient-to-r from-cyan-600 to-violet-600 text-white rounded-lg font-semibold hover:opacity-90 shadow-lg shadow-cyan-500/10 transition-all transform hover:scale-105">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add New Quest
                </button>
            </div>

            {isFormOpen && <QuestForm task={editingTask} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />}

            <div className="space-y-4">
                {sortedUserTasks.length === 0 && !isFormOpen && (
                    <div className="text-center py-16 bg-slate-900/60 backdrop-blur-2xl border border-violet-500/20 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-semibold text-slate-300">No Daily Quests defined.</h3>
                        <p className="text-slate-400">Click 'Add New Quest' to create your custom challenges.</p>
                    </div>
                )}
                {sortedUserTasks.map(task => (
                    <div key={task.id} className="p-4 bg-slate-900/60 backdrop-blur-xl border border-violet-500/10 rounded-xl shadow-lg flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-slate-100">{task.title}</h3>
                            <p className="text-sm text-slate-400">{task.description}</p>
                            <div className="flex items-center text-xs mt-2 text-slate-500 capitalize">
                               <span>{task.scheduleType === 'weekly' ? task.weekdays.map(d => WEEKDAYS[d]).join(', ') : 'Daily'}</span>
                               <span className="mx-2">|</span>
                               <span className={difficultyColors[task.difficulty]}>{task.difficulty}</span>
                               <span className="mx-2">|</span>
                               <span className={priorityColors[task.priority || TaskPriority.Medium]}>{task.priority || 'medium'}</span>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => handleEdit(task)} className="px-3 py-1 text-sm font-medium text-cyan-400 rounded-md hover:bg-cyan-500/20">Edit</button>
                            <button onClick={() => deleteTask(task.id)} className="px-3 py-1 text-sm font-medium text-red-400 rounded-md hover:bg-red-500/20">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TasksPage;