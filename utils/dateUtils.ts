import { Task, ScheduleType, Completion, CompletionStatus } from '../types';

export const getTodayDateString = (): string => {
    return new Date().toISOString().split('T')[0];
};

export const isTaskDueToday = (task: Task): boolean => {
    if (task.status !== 'active') return false;

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 for Sunday

    switch (task.scheduleType) {
        case ScheduleType.Daily:
            return true;
        case ScheduleType.Weekly:
            return task.weekdays.includes(dayOfWeek);
        default:
            return false;
    }
};

export const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};
