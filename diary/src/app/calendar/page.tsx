"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import CalendarView from "@/components/CalendarView";
import DayDetail from "@/components/DayDetail";
import TabBar from "@/components/TabBar";
import type { DiaryEntry } from "@/lib/types";

const USER_ID = "ff537d73-4858-4130-aa74-e19fbb575cee";

export default function CalendarPage() {
  const { ready } = useAuth();
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }, []);

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

  useEffect(() => { if (ready && year !== null && month !== null) fetchMonthEntries(year, month); }, [year, month, ready]);

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
    if (month === null || year === null) return;
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else { setMonth(month - 1); }
  };

  const nextMonth = () => {
    if (month === null || year === null) return;
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else { setMonth(month + 1); }
  };

  if (selectedEntry) {
    return (
      <div className="page-container">
        <DayDetail entry={selectedEntry} onBack={() => setSelectedEntry(null)} />
        <TabBar active="calendar" />
      </div>
    );
  }

  if (year === null || month === null || loading) {
    return (
      <div className="page-container">
        <div className="flex-1 flex items-center justify-center h-40 text-sm text-ink-muted">加载中...</div>
        <TabBar active="calendar" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex-1 overflow-y-auto">
        <CalendarView
          entries={entries}
          year={year}
          month={month}
          onDayClick={handleDayClick}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
        />
      </div>
      <TabBar active="calendar" />
    </div>
  );
}
