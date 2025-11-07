import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Goal, Completion, UserSettings, User, CompletionStatus, LevelInfo, UserStats, GoalDifficulty } from '../types';
import { useAuth } from './AuthContext';
import * as api from '../services/apiService';
import { calculateLevelInfo } from '../constants';
import { getTodayDateString } from '../utils/dateUtils';

interface DataContextType {
  goals: Goal[];
  userGoals: Goal[];
  systemGoals: Goal[];
  completions: Completion[];
  settings: UserSettings | null;
  loading: boolean;
  levelInfo: LevelInfo | null;
  userStats: UserStats | null;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  completeGoal: (goalId: string, note?: string) => Promise<void>;
  updateSettings: (settings: UserSettings) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const userGoals = goals.filter(t => t.type === 'user');
  const systemGoals = goals.filter(t => t.type === 'system');

  const fetchData = useCallback(async (currentUser: User) => {
    setLoading(true);
    const data = await api.fetchAllData(currentUser.id);
    setGoals(data.goals);
    setCompletions(data.completions);
    setSettings(data.settings);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchData(user);
    } else {
      setGoals([]);
      setCompletions([]);
      setSettings(null);
      setLevelInfo(null);
      setUserStats(null);
      setLoading(false);
    }
  }, [user, fetchData]);
  
  useEffect(() => {
      const totalExp = completions.reduce((total, c) => total + c.expAwarded, 0);
      setLevelInfo(calculateLevelInfo(totalExp));
  }, [completions]);

  useEffect(() => {
    if (loading || goals.length === 0) {
        if (!loading) {
             setUserStats({
                totalGoalsCompleted: 0, currentStreak: 0, longestStreak: 0,
                hardGoalsCompleted: 0, physicalGoalsCompleted: 0, mentalGoalsCompleted: 0
            });
        }
        return;
    };

    const goalsById = new Map<string, Goal>(goals.map(g => [g.id, g]));
    const completed = completions.filter(c => c.status === CompletionStatus.Completed);

    // Streaks calculation
    const completionDates = new Set(completed.map(c => c.date));
    let currentStreak = 0;
    let longestStreak = 0;

    // Calculate current streak
    let date = new Date();
    while (true) {
        const dateStr = date.toISOString().split('T')[0];
        if (completionDates.has(dateStr)) {
            currentStreak++;
            date.setDate(date.getDate() - 1);
        } else {
            break;
        }
    }
    
    // Calculate longest streak
    if (completed.length > 0) {
        const sortedDates = [...completionDates].sort();
        if (sortedDates.length > 0) {
            let currentRun = 1;
            longestStreak = 1;
            for (let i = 1; i < sortedDates.length; i++) {
                const prevDate = new Date(sortedDates[i-1] + "T00:00:00");
                const currDate = new Date(sortedDates[i] + "T00:00:00");
                const diffTime = currDate.getTime() - prevDate.getTime();
                const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

                if (diffDays === 1) {
                    currentRun++;
                } else {
                    longestStreak = Math.max(longestStreak, currentRun);
                    currentRun = 1;
                }
            }
            longestStreak = Math.max(longestStreak, currentRun);
        }
    }


    const stats: UserStats = {
        totalGoalsCompleted: completed.length,
        currentStreak,
        longestStreak,
        hardGoalsCompleted: completed.filter(c => goalsById.get(c.taskId)?.difficulty === GoalDifficulty.Hard).length,
        physicalGoalsCompleted: completed.filter(c => goalsById.get(c.taskId)?.category === 'physical').length,
        mentalGoalsCompleted: completed.filter(c => goalsById.get(c.taskId)?.category === 'mental').length,
    };

    setUserStats(stats);
}, [completions, goals, loading]);


  const addGoal = async (goalData: Omit<Goal, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");
    const newGoal = await api.saveGoal(goalData, user.id);
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoal = async (goal: Goal) => {
    if (goal.type === 'system') return; // System goals are not editable for now
    const updatedGoal = await api.updateGoal(goal);
    setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };
  
  const deleteGoal = async (goalId: string) => {
    const goalToDelete = goals.find(g => g.id === goalId);
    if (goalToDelete?.type === 'system') return; // System goals cannot be deleted
    await api.deleteGoal(goalId);
    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  const completeGoal = async (goalId: string, note?: string) => {
    if (!user) throw new Error("User not authenticated");
    const goal = goals.find(g => g.id === goalId);
    if (!goal) throw new Error("Goal not found");

    const newCompletionData = {
      taskId: goalId,
      date: getTodayDateString(),
      status: CompletionStatus.Completed,
      note,
    };
    const newCompletion = await api.addCompletion(newCompletionData, user.id, goal);
    setCompletions(prev => [...prev, newCompletion]);
  };
  
  const updateSettings = async (newSettings: UserSettings) => {
    const updated = await api.updateSettings(newSettings);
    setSettings(updated);
  };

  return (
    <DataContext.Provider value={{ goals, userGoals, systemGoals, completions, settings, loading, levelInfo, userStats, addGoal, updateGoal, deleteGoal, completeGoal, updateSettings }}>
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