import React, { useState, useMemo } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import GoalsPage from './pages/TasksPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import { Layout } from './components/Layout';

type Page = 'dashboard' | 'goals' | 'history' | 'settings';

const AppContent: React.FC = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [page, setPage] = useState<Page>('dashboard');

    React.useEffect(() => {
        // Force dark theme for the "Level Up" aesthetic
        document.documentElement.classList.add('dark');
    }, []);

    if (!user) {
        return <AuthPage />;
    }

    const renderPage = () => {
        const pageComponent = () => {
            switch (page) {
                case 'dashboard': return <DashboardPage />;
                case 'goals': return <GoalsPage />;
                case 'history': return <HistoryPage />;
                case 'settings': return <SettingsPage />;
                default: return <DashboardPage />;
            }
        };

        return (
            <div key={page} className="animate-fadeInUp">
                {pageComponent()}
            </div>
        )
    };

    return (
        <Layout activePage={page} setPage={setPage}>
            {renderPage()}
        </Layout>
    );
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <DataProvider>
                    <AppContent />
                </DataProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;