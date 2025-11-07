import React from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  timezone: string;
}

export enum GoalStatus {
  Active = 'active',
  Paused = 'paused',
}

export enum ScheduleType {
  Daily = 'daily',
  Weekly = 'weekly',
}

export enum GoalDifficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
}

export enum GoalPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: GoalStatus;
  scheduleType: ScheduleType;
  weekdays: number[]; // 0 for Sunday, 1 for Monday, etc.
  createdAt: string;
  difficulty: GoalDifficulty;
  priority: GoalPriority;
  type?: 'user' | 'system';
  category?: 'physical' | 'mental';
}

export enum CompletionStatus {
  Completed = 'completed',
  Skipped = 'skipped',
}

export interface Completion {
  id:string;
  taskId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completedAt: string; // ISO string
  status: CompletionStatus;
  note?: string;
  expAwarded: number;
}

export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark';
  allowFreezeDays: boolean;
  dailyReminderTime?: string; // HH:mm
}

export interface GoalWithCompletion extends Goal {
    completion?: Completion;
}

export interface LevelInfo {
    level: number;
    totalExp: number;
    expToNextLevel: number;
    currentLevelExp: number;
    progressPercentage: number;
}

export interface UserStats {
    totalGoalsCompleted: number;
    currentStreak: number;
    longestStreak: number;
    hardGoalsCompleted: number;
    physicalGoalsCompleted: number;
    mentalGoalsCompleted: number;
}
