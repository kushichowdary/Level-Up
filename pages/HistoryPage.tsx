import React, { useMemo, useState, useCallback } from "react";
import { useData } from "../contexts/DataContext";
import { CompletionStatus } from "../types";

type Completion = {
  id: string;
  taskId: string;
  date: string;
  status: CompletionStatus;
  expAwarded: number;
};

type Goal = {
  id: string;
  title: string;
};

const CELL_SIZE = 12;
const CELL_GAP = 6;
const CELL_TOTAL = CELL_SIZE + CELL_GAP;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const formatDate = (d: Date) => d.toISOString().split("T")[0];

const Tooltip: React.FC<{ x: number; y: number; visible: boolean; content: React.ReactNode }> = ({
  x,
  y,
  visible,
  content,
}) => {
  if (!visible) return null;
  return (
    <div
      className="fixed z-50 p-3 text-sm text-white bg-slate-900/95 backdrop-blur-sm rounded-lg shadow-2xl border border-slate-700/30 pointer-events-none"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, 0)",
        maxWidth: 320,
        maxHeight: 260,
        overflow: "hidden",
        fontFamily: "Poppins, Inter, sans-serif",
      }}
    >
      <div className="max-h-[220px] overflow-y-auto">{content}</div>
    </div>
  );
};

const DashboardHeatmap: React.FC = () => {
  const { completions, goals } = useData();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    content: null as React.ReactNode,
  });

  // Fix: Explicitly type the initial value for the `reduce` function below to correctly infer the type of `dataByDate`.
  // This resolves errors where properties on its values were considered 'unknown' later in the component.
  // Group completions by date
  const dataByDate = useMemo(() => {
    return (completions as Completion[]).reduce((acc: Record<string, { completions: Completion[]; totalExp: number }>, c) => {
      if (c.status !== CompletionStatus.Completed) return acc;
      if (!acc[c.date]) acc[c.date] = { completions: [], totalExp: 0 };
      acc[c.date].completions.push(c);
      acc[c.date].totalExp += c.expAwarded;
      return acc;
    }, {} as Record<string, { completions: Completion[]; totalExp: number }>);
  }, [completions]);

  // Build heatmap data
  const { weeks, monthLabels } = useMemo(() => {
    const startDate = new Date(year, 0, 1);
    const daysInYear =
      (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
    const startWeekday = (startDate.getDay() + 6) % 7; // Monday-first
    const totalSlots = startWeekday + daysInYear;
    const weekCount = Math.ceil(totalSlots / 7);

    const weeksArr: Array<Array<any | null>> = Array.from({ length: weekCount }, () =>
      Array.from({ length: 7 }, () => null)
    );

    for (let i = 0; i < daysInYear; i++) {
      const current = new Date(year, 0, i + 1);
      const dateStr = formatDate(current);
      const slotIndex = startWeekday + i;
      const weekIndex = Math.floor(slotIndex / 7);
      const weekday = slotIndex % 7;
      const dayData = dataByDate[dateStr] || { completions: [], totalExp: 0 };
      weeksArr[weekIndex][weekday] = {
        date: current,
        dateStr,
        count: dayData.completions.length,
        totalExp: dayData.totalExp,
        completions: dayData.completions,
      };
    }

    const labels: { name: string; weekIndex: number }[] = [];
    const seen = new Set<number>();
    for (let w = 0; w < weeksArr.length; w++) {
      for (let r = 0; r < 7; r++) {
        const slot = weeksArr[w][r];
        if (slot && slot.date) {
          const m = slot.date.getMonth();
          if (!seen.has(m)) {
            seen.add(m);
            labels.push({ name: slot.date.toLocaleString("default", { month: "short" }), weekIndex: w });
          }
          break;
        }
      }
    }

    return { weeks: weeksArr, monthLabels: labels };
  }, [year, dataByDate]);

  // EXP level color
  const getLevel = (exp?: number) => {
    const e = exp ?? 0;
    if (e === 0) return "bg-slate-800/60";
    if (e <= 25) return "bg-cyan-900/80";
    if (e <= 75) return "bg-teal-600/80";
    if (e <= 150) return "bg-lime-400/80";
    return "bg-yellow-300/90 shadow-[0_0_8px_rgba(250,204,21,0.5)]";
  };

  // Tooltip
  const showTooltip = useCallback(
    (el: HTMLElement, slot: any) => {
      if (!slot || slot.count === 0) return;
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const y = rect.bottom + 220 > viewportH ? rect.top - 10 : rect.bottom + 8;
      const x = Math.min(Math.max(rect.left + rect.width / 2, 12), window.innerWidth - 12);

      const details = slot.completions.map((c: Completion) => {
        const goal = (goals as Goal[]).find((g) => g.id === c.taskId);
        return { title: goal?.title ?? "Unknown goal", exp: c.expAwarded };
      });

      const content = (
        <div className="flex flex-col gap-1 font-[Poppins]">
          <div>
            <div className="font-semibold">
              {new Date(slot.dateStr).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="text-cyan-300 font-semibold mt-1">
              +{slot.totalExp} EXP
            </div>
          </div>
          <ul className="text-xs text-slate-200 mt-2 border-t border-slate-700 pt-2 max-h-32 overflow-y-auto">
            {details.map((d, i) => (
              <li key={i} className="flex justify-between">
                <span className="truncate pr-2">{d.title}</span>
                <span className="text-cyan-400 font-medium">+{d.exp}</span>
              </li>
            ))}
          </ul>
        </div>
      );

      setTooltip({ visible: true, x, y, content });
    },
    [goals]
  );

  const hideTooltip = useCallback(() => setTooltip((p) => ({ ...p, visible: false })), []);

  // Fix: Cast the result of Object.values to ensure proper type inference for the following reduce calls.
  const dailyData = Object.values(dataByDate) as { completions: Completion[]; totalExp: number }[];
  const totalGoals = dailyData.reduce(
    (a, b) => a + b.completions.length,
    0
  );
  const totalExp = dailyData.reduce(
    (a, b) => a + b.totalExp,
    0
  );

  return (
    <div
      className="p-6 bg-slate-900/60 backdrop-blur-2xl border border-violet-500/20 rounded-2xl shadow-2xl shadow-violet-500/10"
      style={{ fontFamily: "Poppins, Inter, sans-serif" }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-cyan-300">Completion Log</h2>
        <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
          <button onClick={() => setYear((y) => y - 1)} className="px-3 py-1 rounded-md hover:bg-slate-700/40">
            &lt;
          </button>
          <span className="font-semibold text-lg w-24 text-center">{year}</span>
          <button
            onClick={() => setYear((y) => y + 1)}
            disabled={year === new Date().getFullYear()}
            className="px-3 py-1 rounded-md hover:bg-slate-700/40 disabled:opacity-30"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex">
        {/* Weekday labels */}
        <div
          className="flex flex-col justify-between text-xs text-slate-400 font-[Poppins]"
          style={{
            marginTop: CELL_SIZE / 2,
            marginRight: 12,
            height: 7 * CELL_TOTAL - CELL_GAP,
          }}
        >
          {WEEKDAYS.map((d) => (
            <div key={d} style={{ height: CELL_SIZE }}>
              {d}
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div className="overflow-x-auto w-full pb-2">
          <div className="relative" style={{ minWidth: `${weeks.length * CELL_TOTAL}px` }}>
            {/* Month labels */}
            {monthLabels.map(({ name, weekIndex }) => (
              <div
                key={name}
                className="absolute -top-6 text-xs font-semibold text-slate-400"
                style={{ left: `${weekIndex * CELL_TOTAL}px` }}
              >
                {name}
              </div>
            ))}

            {/* Grid */}
            <div
              className="grid grid-flow-col"
              style={{
                gridAutoColumns: `${CELL_SIZE}px`,
                gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
                columnGap: `${CELL_GAP}px`,
                rowGap: `${CELL_GAP}px`,
              }}
            >
              {weeks.map((week, wi) =>
                week.map((slot, di) => {
                  const isToday =
                    slot && slot.dateStr === formatDate(new Date());
                  const color = slot ? getLevel(slot.totalExp) : "bg-slate-800/30";
                  return (
                    <button
                      key={`w${wi}-d${di}`}
                      onMouseEnter={(e) =>
                        showTooltip(e.currentTarget as HTMLElement, slot)
                      }
                      onMouseLeave={hideTooltip}
                      className={`rounded-sm border transition-all duration-150 ${color} ${
                        isToday ? "ring-1 ring-yellow-300" : ""
                      }`}
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        border: "1px solid rgba(148,163,184,0.1)",
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-4 text-xs text-slate-400 font-[Poppins]">
        <div className="flex items-center space-x-2">
          <span>Less</span>
          {[0, 25, 75, 150, 250].map((v) => (
            <div key={v} className={`w-3 h-3 rounded-sm ${getLevel(v)}`}></div>
          ))}
          <span>More (EXP)</span>
        </div>
        <div className="flex items-center gap-4">
          <span>
            Total Goals:{" "}
            <span className="text-cyan-300 font-semibold">{totalGoals}</span>
          </span>
          <span>
            Total EXP:{" "}
            <span className="text-lime-300 font-semibold">{totalExp}</span>
          </span>
        </div>
      </div>

      <Tooltip
        x={tooltip.x}
        y={tooltip.y}
        visible={tooltip.visible}
        content={tooltip.content}
      />
    </div>
  );
};

export default DashboardHeatmap;