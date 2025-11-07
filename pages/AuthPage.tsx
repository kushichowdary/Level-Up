import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
    } catch (err: any) {
      switch (err.code) {
        case 'auth/invalid-credential':
          setError('Invalid email or password. Please try again.');
          break;
        case 'auth/user-not-found': // Kept for some edge cases
        case 'auth/wrong-password': // Kept for some edge cases
          setError('Invalid email or password.');
          break;
        case 'auth/email-already-in-use':
          setError('An account with this email already exists.');
          break;
        case 'auth/weak-password':
          setError('Password is too weak. Must be at least 6 characters.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/quota-exceeded':
          setError('Too many attempts. Please try again later.');
          break;
        default:
          setError('An unexpected error occurred. Please try again.');
          console.error('Authentication Error:', err);
      }
    }
  };

  const inputClass = "appearance-none relative block w-full px-4 py-3 border border-slate-700/50 placeholder-slate-500 text-slate-200 bg-slate-800/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 sm:text-sm transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 space-y-8 bg-slate-900/60 backdrop-blur-2xl border border-violet-500/20 rounded-2xl shadow-2xl shadow-violet-500/10">
        <div>
           <h1 className="text-center text-4xl font-bold font-display text-cyan-400 animate-glow">LEVEL UP</h1>
          <h2 className="mt-4 text-center text-xl font-medium text-slate-300">
            {isLogin ? 'System Access Panel' : 'Register New Player'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="sr-only">Player Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`${inputClass} rounded-t-md`}
                  placeholder="Player Name"
                />
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputClass} ${isLogin ? 'rounded-t-md' : ''}`}
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} rounded-b-md`}
                placeholder="Password"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border-2 border-cyan-500 text-sm font-bold rounded-md text-white bg-cyan-600/30 hover:bg-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-400 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/20"
            >
              {isLogin ? 'Login' : 'Create Account'}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
          <button
            onClick={() => {
                setIsLogin(!isLogin);
                setError('');
            }}
            className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {isLogin ? "No account? Register" : 'Already registered? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;