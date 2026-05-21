"use client";

import { useMemo } from "react";
import type { DiaryEntry } from "@/lib/types";

interface Props {
  entries: DiaryEntry[];
  year: number;
  month: number;
  onDayClick: (dateStr: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

export default function CalendarView({ entries, year, month, onDayClick, onPrevMonth, onNextMonth }: Props) {
  const datesWithDiary = useMemo(() => {
    return new Set(entries.map((e) => e.date));
  }, [entries]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="px-2">
      <div className="flex items-center justify-between px-2 py-3">
        <button onClick={onPrevMonth} className="text-sm text-gray-400 px-2">&lt;</button>
        <span className="text-base font-medium">{year}年{month + 1}月</span>
        <button onClick={onNextMonth} className="text-sm text-gray-400 px-2">&gt;</button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs text-gray-400 py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasDiary = datesWithDiary.has(dateStr);
          const isToday = dateStr === todayStr;

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={`aspect-square flex flex-col items-center justify-center rounded-full text-sm
                ${isToday ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-50"}`}
            >
              {day}
              {hasDiary && (
                <div className={`w-1 h-1 rounded-full mt-0.5 ${isToday ? "bg-white" : "bg-blue-400"}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
