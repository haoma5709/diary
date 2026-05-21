"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import CalendarView from "@/components/CalendarView";
import DayDetail from "@/components/DayDetail";
import TabBar from "@/components/TabBar";
import type { DiaryEntry } from "@/lib/types";

const USER_ID = "your-hardcoded-user-id";

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMonthEntries = async (y: number, m: number) => {
    setLoading(true);
    const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const endDay = new Date(y, m + 1, 0).getDate();
    const end = `${y}-${String(m + 1).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;

    const { data } = await supabase
      .from("diary_entries")
      .select("*")
      .eq("user_id", USER_ID)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false });

    setEntries((data as DiaryEntry[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchMonthEntries(year, month); }, [year, month]);

  const handleDayClick = async (dateStr: string) => {
    const cached = entries.find((e) => e.date === dateStr);
    if (cached) { setSelectedEntry(cached); return; }

    const { data } = await supabase
      .from("diary_entries")
      .select("*")
      .eq("user_id", USER_ID)
      .eq("date", dateStr)
      .maybeSingle();

    setSelectedEntry(data as DiaryEntry | null);
  };

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else { setMonth(month - 1); }
  };

  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else { setMonth(month + 1); }
  };

  if (selectedEntry) {
    return (
      <div className="page-container flex flex-col h-dvh">
        <DayDetail entry={selectedEntry} onBack={() => setSelectedEntry(null)} />
        <TabBar active="calendar" />
      </div>
    );
  }

  return (
    <div className="page-container flex flex-col h-dvh">
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-sm text-gray-300">加载中...</div>
        ) : (
          <CalendarView
            entries={entries}
            year={year}
            month={month}
            onDayClick={handleDayClick}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
          />
        )}
      </div>
      <TabBar active="calendar" />
    </div>
  );
}
