import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { UserSettings } from '../types';

const SettingsPage: React.FC = () => {
    const { settings, updateSettings, completions, goals } = useData();
    const { theme } = useTheme(); // Theme is now fixed to dark
    const { user, updateUser, deleteAccount } = useAuth();
    
    const [profileName, setProfileName] = useState(user?.name || '');
    const [profileEmail, setProfileEmail] = useState(user?.email || '');
    const [isSaved, setIsSaved] = useState(false);

    const handleSettingsChange = (key: keyof UserSettings, value: any) => {
        if (settings) {
            updateSettings({ ...settings, [key]: value });
        }
    };
    
    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if(user && (user.name !== profileName || user.email !== profileEmail)) {
            await updateUser({ ...user, name: profileName, email: profileEmail });
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        }
    }

    const handleExport = () => {
        const headers = ["date", "goal_title", "status", "note", "exp_awarded"];
        const rows = completions.map(c => {
            const goal = goals.find(t => t.id === c.taskId);
            return [c.date, goal?.title || 'N/A', c.status, c.note || '', c.expAwarded].join(',');
        });

        const csvContent = "data:text/csv;charset=utf-s;," + headers.join(',') + "\n" + rows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "level_up_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDeleteAccount = () => {
        const confirmation = window.confirm(
            "Are you sure you want to delete your account? This action is permanent and cannot be undone."
        );
        if (confirmation) {
            deleteAccount().catch(err => {
                console.error("Failed to delete account:", err);
                alert("Failed to delete account. Please try logging out and back in again.");
            });
        }
    }

    if (!settings || !user) {
        return <div>Loading config...</div>;
    }
    
    const inputClass = "mt-1 block w-full rounded-md border-slate-700 bg-slate-800/30 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm";

    const Panel: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
        <div className="p-6 bg-slate-900/60 backdrop-blur-2xl border border-violet-500/20 rounded-2xl shadow-2xl shadow-violet-500/10">
            <h2 className="text-lg font-bold font-display text-cyan-300 mb-4">{title}</h2>
            {children}
        </div>
    );

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold font-display text-slate-100">System Config</h1>
            
            <Panel title="Player Profile">
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-300">Name</label>
                        <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} required className={inputClass} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300">Email</label>
                        <input type="email" value={profileEmail} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
                    </div>
                     <div className="flex justify-end">
                         <button
                            type="submit"
                            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-500/10 disabled:opacity-50 transition-colors"
                            disabled={user.name === profileName && user.email === profileEmail}
                         >
                           {isSaved ? 'Saved!' : 'Save Changes'}
                         </button>
                    </div>
                </form>
            </Panel>
            
            <Panel title="Data Management">
                <button 
                    onClick={handleExport}
                    className="w-full px-4 py-2 bg-cyan-600/80 text-white rounded-lg font-semibold hover:bg-cyan-600 transition-colors"
                >
                    Export All Goal Data as CSV
                </button>
            </Panel>
            
            <div className="p-6 bg-red-900/20 border-2 border-red-500/50 rounded-2xl animate-borderPulse" style={{animationDuration: '3s'}}>
                <h2 className="text-lg font-semibold font-display text-red-300 mb-2">Danger Zone</h2>
                <p className="text-sm text-red-400 mb-4">
                    Deleting your account is permanent and cannot be undone. All your goal data and EXP will be lost.
                </p>
                <button 
                    onClick={handleDeleteAccount}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                    Delete My Account
                </button>
            </div>
        </div>
    );
};

export default SettingsPage;