import { Goal, ScheduleType, GoalDifficulty, LevelInfo, GoalPriority } from './types';

export const EXP_BY_DIFFICULTY: Record<GoalDifficulty, number> = {
    [GoalDifficulty.Easy]: 10,
    [GoalDifficulty.Medium]: 25,
    [GoalDifficulty.Hard]: 50,
};

export const SYSTEM_GOALS: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'status' | 'weekdays'>[] = [
    {
        title: "20 Push-ups",
        description: "A core physical strengthening exercise.",
        scheduleType: ScheduleType.Daily,
        type: 'system',
        category: 'physical',
        difficulty: GoalDifficulty.Easy,
        priority: GoalPriority.Medium,
    },
    {
        title: "20 Sit-ups",
        description: "Strengthen your core.",
        scheduleType: ScheduleType.Daily,
        type: 'system',
        category: 'physical',
        difficulty: GoalDifficulty.Easy,
        priority: GoalPriority.Medium,
    },
    {
        title: "10km Run",
        description: "Build endurance and cardiovascular health.",
        scheduleType: ScheduleType.Daily,
        type: 'system',
        category: 'physical',
        difficulty: GoalDifficulty.Hard,
        priority: GoalPriority.High,
    },
    {
        title: "Walk 7000 steps",
        description: "A great way to stay active.",
        scheduleType: ScheduleType.Daily,
        type: 'system',
        category: 'physical',
        difficulty: GoalDifficulty.Medium,
        priority: GoalPriority.Medium,
    },
    {
        title: "Read for 15 minutes",
        description: "Expand your knowledge and focus.",
        scheduleType: ScheduleType.Daily,
        type: 'system',
        category: 'mental',
        difficulty: GoalDifficulty.Easy,
        priority: GoalPriority.Low,
    },
    {
        title: "Meditate for 10 minutes",
        description: "Clear your mind and reduce stress.",
        scheduleType: ScheduleType.Daily,
        type: 'system',
        category: 'mental',
        difficulty: GoalDifficulty.Easy,
        priority: GoalPriority.Low,
    },
];

export const BASE_EXP_FOR_LEVEL_UP = 2500; // Base EXP for level 1 -> 2
export const LEVEL_EXP_INCREMENT = 100; // Each level requires 100 more EXP than the last

export const calculateLevelInfo = (totalExp: number): LevelInfo => {
    let level = 1;
    let cumulativeExpForCurrentLevel = 0;
    let expForNextLevel = BASE_EXP_FOR_LEVEL_UP;

    while (totalExp >= cumulativeExpForCurrentLevel + expForNextLevel) {
        cumulativeExpForCurrentLevel += expForNextLevel;
        level++;
        expForNextLevel = BASE_EXP_FOR_LEVEL_UP + (level - 1) * LEVEL_EXP_INCREMENT;
    }

    const currentLevelExp = totalExp - cumulativeExpForCurrentLevel;
    const progressPercentage = expForNextLevel > 0 ? (currentLevelExp / expForNextLevel) * 100 : 0;
    
    return {
        level,
        totalExp,
        expToNextLevel: expForNextLevel, // This is the "size" of the current level's EXP bar
        currentLevelExp,
        progressPercentage,
    };
};
