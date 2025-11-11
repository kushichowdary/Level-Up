import React, { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthError } from 'firebase/auth';
import { GridScan } from '../components/GridScan';

const getFirebaseErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
            return 'Invalid email or password.';
        case 'auth/email-already-in-use':
            return 'An account with this email already exists.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
}

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { login, signup } = useAuth();

    const clearForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setError(null);
    };

    const toggleForm = () => {
        setIsLogin(!isLogin);
        clearForm();
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(name, email, password);
            }
        } catch (e: unknown) {
            if (e instanceof Error && 'code' in e) {
                 const authError = e as AuthError;
                 setError(getFirebaseErrorMessage(authError.code));
            } else {
                 setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const getButtonText = () => {
        if (isLoading) return 'ACCESSING...';
        return isLogin ? 'LOG IN' : 'CREATE ACCOUNT';
    };

    const inputClasses = "w-full bg-slate-800/50 text-slate-200 placeholder-slate-500 border border-slate-700 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all disabled:opacity-50";

    return (
        <div className="min-h-screen relative">
            <GridScan
                className="absolute inset-0 w-full h-full z-0"
                linesColor="#2e1065" // tailwind violet-950
                scanColor="#38bdf8"  // tailwind cyan-400
                lineJitter={0.15}
                scanOpacity={0.5}
                scanGlow={0.7}
                bloomIntensity={0.2}
                chromaticAberration={0.005}
                scanOnClick={true}
                scanDuration={1.8}
                scanDelay={2.5}
            />
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                <div className="w-full max-w-md animate-fadeInUp">
                    <div className="text-center mb-8">
                         <p className="text-xl font-display text-slate-300 animate-glow">Welcome, Player</p>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-2xl border border-violet-500/20 rounded-2xl shadow-2xl shadow-violet-500/10 p-8 animate-borderPulse" style={{animationDuration: '3s'}}>
                        <h2 className="text-2xl font-bold text-center text-slate-100 mb-6 font-display">
                            {isLogin ? 'System Access' : 'New Player Registration'}
                        </h2>

                        {error && <p className="bg-red-500/10 text-red-400 text-center text-sm mb-4 p-3 rounded-lg">{error}</p>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isLogin && (
                                 <div>
                                    <label htmlFor="name" className="sr-only">Name</label>
                                    <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Player Name" required disabled={isLoading} className={inputClasses} />
                                </div>
                            )}
                            <div>
                                <label htmlFor="email" className="sr-only">Email</label>
                                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" required disabled={isLoading} className={inputClasses} />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required disabled={isLoading} className={inputClasses} />
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-all duration-300 shadow-lg shadow-cyan-500/10 disabled:bg-cyan-600/50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-100">
                                {getButtonText()}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <button onClick={toggleForm} className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline">
                                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
