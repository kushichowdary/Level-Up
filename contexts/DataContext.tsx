import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Task, Completion, UserSettings, User, CompletionStatus, LevelInfo } from '../types';
import { useAuth } from './AuthContext';
import * as api from '../services/mockApiService';
import { calculateLevelInfo } from '../constants';
import { getTodayDateString } from '../utils/dateUtils';

interface DataContextType {
  tasks: Task[];
  userTasks: Task[];
  systemQuests: Task[];
  completions: Completion[];
  settings: UserSettings | null;
  loading: boolean;
  levelInfo: LevelInfo | null;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string, note?: string) => Promise<void>;
  updateSettings: (settings: UserSettings) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const userTasks = tasks.filter(t => t.type === 'user');
  const systemQuests = tasks.filter(t => t.type === 'system');

  const fetchData = useCallback(async (currentUser: User) => {
    setLoading(true);
    const data = await api.mockFetchAllData(currentUser.id);
    setTasks(data.tasks);
    setCompletions(data.completions);
    setSettings(data.settings);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchData(user);
    } else {
      setTasks([]);
      setCompletions([]);
      setSettings(null);
      setLoading(false);
    }
  }, [user, fetchData]);
  
  useEffect(() => {
      const totalExp = completions.reduce((total, c) => total + c.expAwarded, 0);
      setLevelInfo(calculateLevelInfo(totalExp));
  }, [completions]);


  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");
    const newTask = await api.mockSaveTask(taskData, user.id);
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = async (task: Task) => {
    if (task.type === 'system') return; // System quests are not editable
    const updatedTask = await api.mockUpdateTask(task);
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };
  
  const deleteTask = async (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (taskToDelete?.type === 'system') return; // System quests cannot be deleted
    await api.mockDeleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const completeTask = async (taskId: string, note?: string) => {
    if (!user) throw new Error("User not authenticated");
    const task = tasks.find(t => t.id === taskId);
    if (!task) throw new Error("Task not found");

    const newCompletionData = {
      taskId,
      date: getTodayDateString(),
      status: CompletionStatus.Completed,
      note,
    };
    const newCompletion = await api.mockAddCompletion(newCompletionData, user.id, task);
    setCompletions(prev => [...prev, newCompletion]);
  };
  
  const updateSettings = async (newSettings: UserSettings) => {
    const updated = await api.mockUpdateSettings(newSettings);
    setSettings(updated);
  };

  return (
    <DataContext.Provider value={{ tasks, userTasks, systemQuests, completions, settings, loading, levelInfo, addTask, updateTask, deleteTask, completeTask, updateSettings }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};