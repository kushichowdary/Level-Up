import { auth, db } from '../firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    onAuthStateChanged as onFirebaseAuthStateChanged,
    User as FirebaseUser,
    deleteUser
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
    deleteDoc,
} from 'firebase/firestore';

import { User, Goal, Completion, UserSettings, GoalStatus } from '../types';
import { EXP_BY_DIFFICULTY, SYSTEM_GOALS } from '../constants';

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
    
    // 3. Create System Goals with stable, user-specific IDs
    SYSTEM_GOALS.forEach((goal) => {
        const goalSlug = goal.title.toLowerCase().replace(/\s+/g, '-');
        const goalId = `system-${userId}-${goalSlug}`;
        const newSystemGoal: Goal = {
            ...goal,
            id: goalId, // ID is now unique and stable
            userId: userId,
            createdAt: new Date().toISOString(),
            status: GoalStatus.Active,
            weekdays: [],
            type: 'system'
        };
        const goalRef = doc(db, 'tasks', goalId);
        batch.set(goalRef, newSystemGoal);
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
    const { id, ...profileData } = user;
    await setDoc(userRef, profileData, { merge: true });
    // Return a new, guaranteed-clean object instead of the original `user` object.
    // This prevents any possibility of non-serializable data being passed back into the application state.
    return { id, ...profileData };
};

export const deleteUserAccount = async (userId: string): Promise<void> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || firebaseUser.uid !== userId) {
        throw new Error("Authentication error: Cannot delete account.");
    }
    
    const batch = writeBatch(db);

    // 1. Delete user profile
    batch.delete(doc(db, 'users', userId));

    // 2. Delete settings
    batch.delete(doc(db, 'settings', userId));

    // 3. Delete all goals (tasks collection)
    const goalsQuery = query(collection(db, 'tasks'), where('userId', '==', userId));
    const goalsSnap = await getDocs(goalsQuery);
    goalsSnap.forEach(doc => batch.delete(doc.ref));

    // 4. Delete all completions
    const completionsQuery = query(collection(db, 'completions'), where('userId', '==', userId));
    const completionsSnap = await getDocs(completionsQuery);
    completionsSnap.forEach(doc => batch.delete(doc.ref));
    
    // Commit all Firestore deletions
    await batch.commit();

    // 5. Delete the user from Firebase Auth
    await deleteUser(firebaseUser);
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
            goals: [], 
            completions: [], 
            settings
        };
    }

    const settings = sanitizeDoc(settingsSnap.data()) as UserSettings;

    const goalsQuery = query(collection(db, 'tasks'), where('userId', '==', userId));
    const goalsSnap = await getDocs(goalsQuery);
    const goals: Goal[] = goalsSnap.docs.map(d => {
        const data = sanitizeDoc(d.data());
        return { id: d.id, ...data } as Goal;
    });
    
    const completionsQuery = query(collection(db, 'completions'), where('userId', '==', userId));
    const completionsSnap = await getDocs(completionsQuery);
    const completions: Completion[] = completionsSnap.docs.map(d => {
        const data = sanitizeDoc(d.data());
        return { id: d.id, ...data } as Completion;
    });

    return { goals, completions, settings };
};


// Goal Functions
export const saveGoal = async (goalData: Omit<Goal, 'id' | 'createdAt' | 'userId'>, userId: string): Promise<Goal> => {
    const goalCollRef = collection(db, 'tasks');
    const docRef = await addDoc(goalCollRef, {
        ...goalData,
        userId,
        createdAt: new Date().toISOString(),
        type: 'user'
    });
    return { ...goalData, id: docRef.id, createdAt: new Date().toISOString(), userId, type: 'user' };
};

export const updateGoal = async (goal: Goal): Promise<Goal> => {
    const goalRef = doc(db, 'tasks', goal.id);

    // Deep clone and sanitize before sending to Firestore
    const cleanData = sanitizeDoc({
        userId: goal.userId,
        title: goal.title,
        description: goal.description,
        status: goal.status,
        scheduleType: goal.scheduleType,
        weekdays: goal.weekdays || [],
        createdAt: goal.createdAt,
        difficulty: goal.difficulty,
        priority: goal.priority,
        type: goal.type,
        category: goal.category,
    });

    // Remove undefined fields, as Firestore doesn't allow them
    Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) {
            delete cleanData[key];
        }
    });

    await setDoc(goalRef, cleanData, { merge: true });
    return { id: goal.id, ...cleanData } as Goal;
};

export const deleteGoal = async (goalId: string): Promise<void> => {
    // Also delete associated completions
    const completionsQuery = query(collection(db, 'completions'), where('taskId', '==', goalId));
    const completionsSnap = await getDocs(completionsQuery);
    const batch = writeBatch(db);
    completionsSnap.forEach(doc => batch.delete(doc.ref));
    batch.delete(doc(db, 'tasks', goalId));
    await batch.commit();
};

// Completion Functions
export const addCompletion = async (completionData: Omit<Completion, 'id' | 'userId' | 'completedAt' | 'expAwarded'>, userId: string, goal: Goal): Promise<Completion> => {
    const expAwarded = EXP_BY_DIFFICULTY[goal.difficulty];
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
    
    // Deep clone and sanitize before sending to Firestore
    const cleanData = sanitizeDoc({
        userId: settings.userId,
        theme: settings.theme,
        allowFreezeDays: settings.allowFreezeDays,
        dailyReminderTime: settings.dailyReminderTime,
    });
    
    // Remove undefined fields
    Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) {
            delete cleanData[key];
        }
    });

    await setDoc(settingsRef, cleanData, { merge: true });
    return cleanData as UserSettings;
};