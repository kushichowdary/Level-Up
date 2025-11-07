import { User, Task, Completion, UserSettings, TaskStatus } from '../types';
import { EXP_BY_DIFFICULTY, SYSTEM_QUESTS } from '../constants';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const save = (key: string, data: any) => localStorage.setItem(`level-up:${key}`, JSON.stringify(data));
const load = (key: string, defaultValue: any = null) => {
    const data = localStorage.getItem(`level-up:${key}`);
    return data ? JSON.parse(data) : defaultValue;
};

// Users
export const mockLogin = async (email: string, password_hash: string): Promise<User | null> => {
    const users = load('users', []);
    const user = users.find((u: User) => u.email === email);
    if (user) return user;
    return null;
};

export const mockSignup = async (name: string, email: string, password_hash: string): Promise<User> => {
    const users = load('users', []);
    if (users.some((u: User) => u.email === email)) {
        throw new Error('User with this email already exists.');
    }
    const newUser: User = {
        id: generateId(),
        name,
        email,
        createdAt: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    save('users', [...users, newUser]);
    const defaultSettings: UserSettings = {
        userId: newUser.id,
        theme: 'dark',
        allowFreezeDays: false,
    };
    const settings = load('settings', []);
    save('settings', [...settings, defaultSettings]);
    return newUser;
};

export const mockUpdateUser = async (updatedUser: User): Promise<User> => {
    let users = load('users', []);
    users = users.map((u: User) => u.id === updatedUser.id ? updatedUser : u);
    save('users', users);
    return updatedUser;
};


// Data
export const mockFetchAllData = async (userId: string) => {
    const settings = load('settings', []);
    let userSettings = settings.find((s: UserSettings) => s.userId === userId);
    if (!userSettings) {
        userSettings = {
            userId: userId,
            theme: 'dark',
            allowFreezeDays: false,
        };
        save('settings', [...settings, userSettings]);
    }
    
    const userTasks = load('tasks', []).filter((t: Task) => t.userId === userId).map(t => ({...t, type: 'user', priority: t.priority || 'medium'}));
    
    const systemTasksWithIds = SYSTEM_QUESTS.map((quest, index) => ({
        ...quest,
        id: `system-${index}`,
        userId: userId,
        createdAt: new Date().toISOString(),
        status: TaskStatus.Active,
        weekdays: [],
    }));

    return {
        tasks: [...userTasks, ...systemTasksWithIds],
        completions: load('completions', []).filter((c: Completion) => c.userId === userId),
        settings: userSettings,
    };
};

// Tasks
export const mockSaveTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'userId'>, userId: string): Promise<Task> => {
    const newTask: Task = {
        id: generateId(),
        userId,
        createdAt: new Date().toISOString(),
        type: 'user',
        ...taskData,
    };
    const tasks = load('tasks', []);
    save('tasks', [...tasks, newTask]);
    return newTask;
};

export const mockUpdateTask = async (updatedTask: Task): Promise<Task> => {
    let tasks = load('tasks', []);
    tasks = tasks.map((t: Task) => t.id === updatedTask.id ? updatedTask : t);
    save('tasks', tasks);
    return updatedTask;
};

export const mockDeleteTask = async (taskId: string): Promise<void> => {
    let tasks = load('tasks', []);
    tasks = tasks.filter((t: Task) => t.id !== taskId);
    save('tasks', tasks);
    let completions = load('completions', []);
    completions = completions.filter((c: Completion) => c.taskId !== taskId);
    save('completions', completions);
};

// Completions
export const mockAddCompletion = async (completionData: Omit<Completion, 'id' | 'userId' | 'completedAt' | 'expAwarded'>, userId: string, task: Task): Promise<Completion> => {
    const expAwarded = EXP_BY_DIFFICULTY[task.difficulty];
    const newCompletion: Completion = {
        id: generateId(),
        userId,
        completedAt: new Date().toISOString(),
        expAwarded,
        ...completionData,
    };
    const completions = load('completions', []);
    save('completions', [...completions, newCompletion]);
    return newCompletion;
};

// Settings
export const mockUpdateSettings = async (newSettings: UserSettings): Promise<UserSettings> => {
    let settings = load('settings', []);
    const userSettingsExist = settings.some((s: UserSettings) => s.userId === newSettings.userId);
    if(userSettingsExist) {
        settings = settings.map((s: UserSettings) => s.userId === newSettings.userId ? newSettings : s);
    } else {
        settings.push(newSettings);
    }
    save('settings', settings);
    return newSettings;
};