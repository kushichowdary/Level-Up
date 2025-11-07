import { auth, db } from '../firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    onAuthStateChanged as onFirebaseAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';
import { 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    query, 
    where, 
    getDocs,
    writeBatch,
    addDoc,
    updateDoc,
    deleteDoc,
    Timestamp,
} from 'firebase/firestore';

import { User, Task, Completion, UserSettings, TaskStatus } from '../types';
import { EXP_BY_DIFFICULTY, SYSTEM_QUESTS } from '../constants';

// A robust, recursive function to sanitize any data from Firestore.
// It converts Timestamps to ISO strings and ensures that only plain objects and arrays
// are passed into the application state, preventing circular reference errors.
const sanitizeDoc = (data: any): any => {
    if (data === null || data === undefined) {
        return data;
    }

    // Firestore Timestamps have a toDate method.
    if (typeof data.toDate === 'function') {
        return data.toDate().toISOString();
    }

    // Recursively sanitize arrays.
    if (Array.isArray(data)) {
        return data.map(item => sanitizeDoc(item));
    }

    // Recursively sanitize objects. This is more robust than checking `constructor`.
    if (typeof data === 'object') {
        const sanitizedObject: { [key: string]: any } = {};
        for (const key in data) {
            // Ensure we only process own properties.
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                sanitizedObject[key] = sanitizeDoc(data[key]);
            }
        }
        return sanitizedObject;
    }

    // Return primitives and other types as-is.
    return data;
};


// Auth Functions
export const login = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);
export const signup = (email: string, password: string) => createUserWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);
export const onAuthStateChanged = (callback: (user: FirebaseUser | null) => void) => onFirebaseAuthStateChanged(auth, callback);


// User Profile Functions
export const createUserProfile = async (firebaseUser: FirebaseUser, name: string): Promise<User> => {
    const batch = writeBatch(db);
    const userId = firebaseUser.uid;

    // 1. Create User Profile
    const userProfileRef = doc(db, 'users', userId);
    const userProfile: User = {
        id: userId,
        name,
        email: firebaseUser.email!,
        createdAt: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    batch.set(userProfileRef, userProfile);

    // 2. Create Default Settings
    const settingsRef = doc(db, 'settings', userId);
    const userSettings: UserSettings = { 
        userId: userId, 
        theme: 'dark', 
        allowFreezeDays: false 
    };
    batch.set(settingsRef, userSettings);
    
    // 3. Create System Quests with stable, user-specific IDs
    SYSTEM_QUESTS.forEach((quest) => {
        const questSlug = quest.title.toLowerCase().replace(/\s+/g, '-');
        const questId = `system-${userId}-${questSlug}`;
        const newSystemTask: Task = {
            ...quest,
            id: questId, // ID is now unique and stable
            userId: userId,
            createdAt: new Date().toISOString(),
            status: TaskStatus.Active,
            weekdays: [],
            type: 'system'
        };
        const taskRef = doc(db, 'tasks', questId);
        batch.set(taskRef, newSystemTask);
    });

    await batch.commit();

    return userProfile;
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
        const data = sanitizeDoc(userDoc.data());
        return { id: userDoc.id, ...data } as User;
    }
    return null;
};

export const updateUserProfile = async (user: User): Promise<User> => {
    const userRef = doc(db, 'users', user.id);
    // Defensively create a new, clean object to ensure no circular references or complex objects are passed to Firestore.
    const cleanUser: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        timezone: user.timezone,
    };
    await setDoc(userRef, cleanUser, { merge: true });
    return cleanUser;
};

// Data Functions
export const fetchAllData = async (userId: string) => {
    const settingsRef = doc(db, 'settings', userId);
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
        console.error("Critical: User settings not found for user:", userId);
        const settings: UserSettings = {
            userId: userId,
            theme: 'dark',
            allowFreezeDays: false,
        };
        return { 
            tasks: [], 
            completions: [], 
            settings
        };
    }

    const settings = sanitizeDoc(settingsSnap.data()) as UserSettings;

    const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', userId));
    const tasksSnap = await getDocs(tasksQuery);
    const tasks: Task[] = tasksSnap.docs.map(d => sanitizeDoc({ id: d.id, ...d.data() }) as Task);
    
    const completionsQuery = query(collection(db, 'completions'), where('userId', '==', userId));
    const completionsSnap = await getDocs(completionsQuery);
    const completions: Completion[] = completionsSnap.docs.map(d => sanitizeDoc({ id: d.id, ...d.data() }) as Completion);

    return { tasks, completions, settings };
};


// Task Functions
export const saveTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'userId'>, userId: string): Promise<Task> => {
    const taskCollRef = collection(db, 'tasks');
    const docRef = await addDoc(taskCollRef, {
        ...taskData,
        userId,
        createdAt: new Date().toISOString(),
        type: 'user'
    });
    return { ...taskData, id: docRef.id, createdAt: new Date().toISOString(), userId, type: 'user' };
};

export const updateTask = async (task: Task): Promise<Task> => {
    const taskRef = doc(db, 'tasks', task.id);

    // Defensively create a clean data object from the input to prevent circular structure errors.
    const cleanData: any = {
        userId: task.userId,
        title: task.title,
        description: task.description,
        status: task.status,
        scheduleType: task.scheduleType,
        weekdays: task.weekdays,
        createdAt: task.createdAt,
        difficulty: task.difficulty,
        priority: task.priority,
        type: task.type,
        category: task.category,
    };

    // Firestore SDK throws an error for undefined fields.
    Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) {
            delete cleanData[key];
        }
    });

    await setDoc(taskRef, cleanData, { merge: true });
    return { id: task.id, ...cleanData } as Task;
};

export const deleteTask = async (taskId: string): Promise<void> => {
    // Also delete associated completions
    const completionsQuery = query(collection(db, 'completions'), where('taskId', '==', taskId));
    const completionsSnap = await getDocs(completionsQuery);
    const batch = writeBatch(db);
    completionsSnap.forEach(doc => batch.delete(doc.ref));
    batch.delete(doc(db, 'tasks', taskId));
    await batch.commit();
};

// Completion Functions
export const addCompletion = async (completionData: Omit<Completion, 'id' | 'userId' | 'completedAt' | 'expAwarded'>, userId: string, task: Task): Promise<Completion> => {
    const expAwarded = EXP_BY_DIFFICULTY[task.difficulty];
    const newCompletionData = {
        ...completionData,
        userId,
        expAwarded,
        completedAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, 'completions'), newCompletionData);
    return { id: docRef.id, ...newCompletionData };
};

// Settings Functions
export const updateSettings = async (settings: UserSettings): Promise<UserSettings> => {
    const settingsRef = doc(db, 'settings', settings.userId);
    // Defensively create a clean object to ensure no circular references or complex objects are passed to Firestore.
    const cleanData: any = {
        userId: settings.userId,
        theme: settings.theme,
        allowFreezeDays: settings.allowFreezeDays,
        dailyReminderTime: settings.dailyReminderTime,
    };
    // Remove undefined fields.
    Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) {
            delete cleanData[key];
        }
    });
    await setDoc(settingsRef, cleanData, { merge: true });
    return cleanData as UserSettings;
};