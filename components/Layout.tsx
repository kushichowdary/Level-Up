import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { BarChartIcon, SwordsIcon, BookOpenIcon, SettingsIcon, SunIcon, MoonIcon, LogoutIcon } from './Icons';

type Page = 'dashboard' | 'tasks' | 'history' | 'settings';

interface LayoutProps {
    children: React.ReactNode;
    activePage: Page;
    setPage: (page: Page) => void;
}

const navItems = [
    { id: 'dashboard', label: 'Status', icon: BarChartIcon },
    { id: 'tasks', label: 'Daily Quests', icon: SwordsIcon },
    { id: 'history', label: 'Quest Log', icon: BookOpenIcon },
] as const;


export const Layout: React.FC<LayoutProps> = ({ children, activePage, setPage }) => {
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const SidebarContent = () => (
        <>
            <div className="flex items-center justify-center h-20 border-b border-violet-500/20">
                <h1 className="text-3xl font-bold font-display text-cyan-400 animate-glow">LEVEL UP</h1>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setPage(item.id)}
                        className={`group relative flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 overflow-hidden ${
                            activePage === item.id 
                            ? 'bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.3),_inset_0_0_4px_rgba(56,189,248,0.2)]' 
                            : 'text-slate-400 hover:bg-cyan-500/5 hover:text-cyan-300'
                        }`}
                    >
                        <div className={`absolute left-0 top-0 h-full w-1 bg-cyan-400 transition-transform duration-300 ease-in-out shadow-[0_0_8px_theme(colors.cyan.400)] ${activePage === item.id ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100'}`}></div>
                        <item.icon className={`w-5 h-5 mr-4 transition-colors duration-200 ${activePage === item.id ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400'}`} />
                        <span className="truncate">{item.label}</span>
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-violet-500/20">
                 <button
                    onClick={() => setPage('settings')}
                    className={`group relative flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 overflow-hidden ${
                        activePage === 'settings' 
                        ? 'bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.3),_inset_0_0_4px_rgba(56,189,248,0.2)]' 
                        : 'text-slate-400 hover:bg-cyan-500/5 hover:text-cyan-300'
                    }`}
                >
                    <div className={`absolute left-0 top-0 h-full w-1 bg-cyan-400 transition-transform duration-300 ease-in-out shadow-[0_0_8px_theme(colors.cyan.400)] ${activePage === 'settings' ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100'}`}></div>
                    <SettingsIcon className={`w-5 h-5 mr-4 transition-colors duration-200 ${activePage === 'settings' ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400'}`} />
                    System Config
                </button>
                <div className="flex items-center justify-between mt-4">
                     <button onClick={logout} className="flex items-center w-full px-4 py-2 text-sm font-medium rounded-lg text-slate-400 hover:bg-red-500/10 group">
                        <LogoutIcon className="w-5 h-5 mr-3 text-slate-500 group-hover:text-red-400 transition-colors" />
                        Logout
                    </button>
                    {/* Theme toggle is disabled for consistent aesthetic */}
                    {/* <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-cyan-500/10">
                        {theme === 'dark' ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6 text-slate-300" />}
                    </button> */}
                </div>
            </div>
        </>
    );

    return (
        <div className="flex h-screen font-sans text-slate-300">
            {/* Sidebar for desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-slate-900/60 backdrop-blur-2xl border-r border-violet-500/20">
                <SidebarContent />
            </aside>

            <div className="flex flex-col flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>

                {/* Bottom nav for mobile */}
                <footer className="md:hidden sticky bottom-0 bg-slate-900/80 backdrop-blur-lg border-t border-violet-500/20">
                    <nav className="flex justify-around">
                        {[...navItems, { id: 'settings', label: 'Config', icon: SettingsIcon }].map(item => (
                            <button
                                key={item.id}
                                onClick={() => setPage(item.id as Page)}
                                className={`flex flex-col items-center justify-center w-full p-3 text-xs transition-colors duration-200 ${
                                    activePage === item.id ? 'text-cyan-400' : 'text-slate-500'
                                }`}
                            >
                                <item.icon className="w-6 h-6 mb-1" />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </footer>
            </div>
        </div>
    );
};