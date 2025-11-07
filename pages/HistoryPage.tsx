import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { CompletionStatus } from '../types';

const Tooltip: React.FC<{ x: number, y: number, content: React.ReactNode }> = ({ x, y, content }) => {
    return (
        <div
            className="fixed z-50 p-3 text-sm text-white bg-slate-900/90 backdrop-blur-sm rounded-lg shadow-lg border border-violet-500/20 pointer-events-none transition-opacity duration-200"
            style={{ top: y + 15, left: x + 15, opacity: 1 }}
        >
            {content}
        </div>
    );
};

const CalendarHeatmap: React.FC = () => {
    const { completions, goals } = useData();
    const [year, setYear] = useState(new Date().getFullYear());
    const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; content: React.ReactNode }>({
        visible: false, x: 0, y: 0, content: null
    });

    const dataByDate = useMemo(() => {
        return completions.reduce((acc, comp) => {
            if (comp.status !== CompletionStatus.Completed) return acc;
            if (!acc[comp.date]) {
                acc[comp.date] = { completions: [], totalExp: 0 };
            }
            acc[comp.date].completions.push(comp);
            acc[comp.date].totalExp += comp.expAwarded;
            return acc;
        }, {} as Record<string, { completions: typeof completions, totalExp: number }>);
    }, [completions]);
    
    const { days, dayOfWeekOffset, monthLabels } = useMemo(() => {
        const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
        const daysInYear = isLeap(year) ? 366 : 365;
        const startDate = new Date(year, 0, 1);
        const dayOfWeekOffset = startDate.getDay();
        
        const days = Array.from({ length: daysInYear }, (_, i) => {
            const date = new Date(year, 0, i + 1);
            const dateString = date.toISOString().split('T')[0];
            const dayData = dataByDate[dateString] || { completions: [], totalExp: 0 };
            return { date, dateString, count: dayData.completions.length, totalExp: dayData.totalExp, completions: dayData.completions };
        });

        const monthLabels = [];
        for (let i = 0; i < 12; i++) {
            const firstDayOfMonth = new Date(year, i, 1);
            const weekIndex = Math.floor((firstDayOfMonth.getDay() - dayOfWeekOffset + new Date(year, i, 1).getDate() - 1 + dayOfWeekOffset) / 7);
            monthLabels.push({
                name: firstDayOfMonth.toLocaleString('default', { month: 'short' }),
                weekIndex: weekIndex
            });
        }
        
        return { days, dayOfWeekOffset, monthLabels };
    }, [year, dataByDate]);


    const getLevel = (totalExp: number) => {
        if (totalExp === 0) return 'bg-slate-800/50';
        if (totalExp <= 25) return 'bg-cyan-900 shadow-[inset_0_0_2px_rgba(56,189,248,0.5)]';
        if (totalExp <= 75) return 'bg-cyan-700 shadow-[inset_0_0_4px_rgba(56,189,248,0.7)]';
        if (totalExp <= 150) return 'bg-cyan-500 shadow-[inset_0_0_6px_rgba(56,189,248,1)]';
        return 'bg-yellow-400 shadow-[inset_0_0_8px_rgba(250,204,21,1)]'; // Legendary day
    };
    
    const handleMouseEnter = (e: React.MouseEvent, day: typeof days[0]) => {
        if (day.count === 0) return;
        const completedGoals = day.completions.map(c => goals.find(t => t.id === c.taskId)?.title).filter(Boolean);
        const content = (
            <div className="flex flex-col gap-1 max-w-xs">
                <p className="font-bold">{new Date(day.dateString + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                <p className="font-bold text-cyan-400">+{day.totalExp} EXP</p>
                <p className="text-xs text-slate-300 border-t border-slate-600 pt-1 mt-1">{day.count} {day.count === 1 ? 'goal' : 'goals'} completed:</p>
                <ul className="text-xs list-disc list-inside space-y-0.5">
                    {completedGoals.map((title, i) => <li key={i}>{title}</li>)}
                </ul>
            </div>
        );
        setTooltip({ visible: true, x: e.clientX, y: e.clientY, content });
    };

    const handleMouseLeave = () => {
        setTooltip(prev => ({ ...prev, visible: false }));
    };
    
    const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-2xl border border-violet-500/20 rounded-2xl shadow-2xl shadow-violet-500/10">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-display text-cyan-300">Completion Log</h2>
                <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
                    <button onClick={() => setYear(y => y - 1)} className="px-2 py-1 rounded-md hover:bg-slate-700/50">&lt;</button>
                    <span className="font-semibold text-lg w-20 text-center">{year}</span>
                    <button onClick={() => setYear(y => y + 1)} className="px-2 py-1 rounded-md hover:bg-slate-700/50" disabled={year === new Date().getFullYear()}>&gt;</button>
                </div>
            </div>
            <div className="flex">
                <div className="flex flex-col text-xs text-slate-500 pr-2 space-y-[1.1rem] mt-8">
                    {WEEKDAYS.map((day, i) => i % 2 !== 0 && <div key={day}>{day}</div>)}
                </div>
                <div className="overflow-x-auto pb-2">
                    <div className="grid grid-flow-col grid-rows-7 gap-1.5 relative">
                        {monthLabels.map(month => (
                             <div key={month.name} className="absolute -top-6 text-xs font-semibold text-slate-400" style={{ left: `${month.weekIndex * 18.5}px`}}>{month.name}</div>
                        ))}
                        {Array.from({ length: dayOfWeekOffset }).map((_, i) => <div key={`empty-${i}`} />)}
                        {days.map(day => (
                            <div
                                key={day.dateString}
                                className={`w-4 h-4 rounded transition-transform duration-150 hover:scale-125 ${getLevel(day.totalExp)}`}
                                onMouseEnter={(e) => handleMouseEnter(e, day)}
                                onMouseLeave={handleMouseLeave}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex justify-end items-center mt-4 text-xs space-x-2 text-slate-500">
                <span>Less</span>
                <div className={`w-3 h-3 rounded ${getLevel(0)}`}></div>
                <div className={`w-3 h-3 rounded ${getLevel(10)}`}></div>
                <div className={`w-3 h-3 rounded ${getLevel(50)}`}></div>
                <div className={`w-3 h-3 rounded ${getLevel(100)}`}></div>
                 <div className={`w-3 h-3 rounded ${getLevel(200)}`}></div>
                <span>More (EXP)</span>
            </div>
             {tooltip.visible && <Tooltip x={tooltip.x} y={tooltip.y} content={tooltip.content} />}
        </div>
    );
};


const HistoryPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-display text-slate-100">Goal Archive</h1>
            <CalendarHeatmap />
        </div>
    );
};

export default HistoryPage;