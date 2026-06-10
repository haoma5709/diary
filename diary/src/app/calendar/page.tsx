"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import TabBar from "@/components/TabBar";
import type { DiaryEntry } from "@/lib/types";
import { mdComponents } from "@/lib/markdown";
import { withTimeout } from "@/lib/timeout";

const USER_ID = "ff537d73-4858-4130-aa74-e19fbb575cee";

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number) {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateCN(d: Date) {
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

const WEEKDAY_NAMES = ["一", "二", "三", "四", "五", "六", "日"];
const MONTH_WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export default function CalendarPage() {
  const { ready } = useAuth();
  const [view, setView] = useState<"week" | "month">("week");
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()));
  const [monthYear, setMonthYear] = useState({ y: new Date().getFullYear(), m: new Date().getMonth() });
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const weekScrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  const handlePrev = () => {
    if (view === "week") setCurrentMonday((d) => addDays(d, -7));
    else setMonthYear((p) => p.m === 0 ? { y: p.y - 1, m: 11 } : { y: p.y, m: p.m - 1 });
  };
  const handleNext = () => {
    if (view === "week") setCurrentMonday((d) => addDays(d, 7));
    else setMonthYear((p) => p.m === 11 ? { y: p.y + 1, m: 0 } : { y: p.y, m: p.m + 1 });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dy) > 60) {
      if (dy > 0) handlePrev();  // swipe down = previous
      else handleNext();         // swipe up = next
    }
  };

  // Fetch a wide window (current month ± 1) so week/month views have data
  useEffect(() => {
    if (!ready) return;
    setLoading(true);

    const { y, m } = monthYear;
    const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    let end: string;
    if (m === 0) {
      end = `${y - 1}-12-${new Date(y - 1, 12, 0).getDate()}`;
    } else if (m === 11) {
      end = `${y + 1}-01-${new Date(y + 1, 1, 0).getDate()}`;
    } else {
      end = `${y}-${String(m + 2).padStart(2, "0")}-01`;
    }

    (async () => {
      try {
        const { data } = await withTimeout(
          supabase
            .from("diary_entries")
            .select("*")
            .eq("user_id", USER_ID)
            .gte("date", start)
            .lt("date", end)
            .order("date", { ascending: true }),
          15000
        );
        setEntries((data as DiaryEntry[]) ?? []);
      } catch (e) {
        console.error("calendar fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [ready, monthYear]);

  // Build a map of date → entry
  const entryByDate = useMemo(() => {
    const m = new Map<string, DiaryEntry>();
    entries.forEach((e) => m.set(e.date, e));
    return m;
  }, [entries]);

  // Generate current week days (Mon-Sun)
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(currentMonday, i));
    }
    return days;
  }, [currentMonday]);

  const handlePrevWeek = () => setCurrentMonday((d) => addDays(d, -7));
  const handleNextWeek = () => setCurrentMonday((d) => addDays(d, 7));

  const handleDayClick = (dateStr: string) => {
    const e = entryByDate.get(dateStr) ?? null;
    setSelectedEntry(e);
  };

  const handleBackFromDetail = () => setSelectedEntry(null);

  // Day detail view
  if (selectedEntry !== null) {
    return (
      <div className="page-container">
        <DayDetailView
          entry={selectedEntry}
          onBack={handleBackFromDetail}
        />
        <TabBar active="calendar" />
      </div>
    );
  }

  const today = formatDate(new Date());

  return (
    <div className="page-container" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Header with view toggle */}
      <div className="flex items-center justify-center pt-6 pb-2 px-7 relative flex-shrink-0">
        <button
          onClick={handlePrev}
          className="absolute left-7 text-[0.9rem] text-ink-muted py-1 px-2 cursor-pointer hover:text-ink transition-colors"
        >
          &lt;
        </button>
        <div className="flex gap-1 rounded-xl p-0.5">
          <button
            onClick={() => setView("week")}
            className={`py-2 px-4 text-[0.8rem] font-sans cursor-pointer transition-all rounded-[10px] ${view === "week" ? "glass-surface text-rust font-semibold" : "bg-transparent text-ink-muted"}`}
          >
            周
          </button>
          <button
            onClick={() => setView("month")}
            className={`py-2 px-4 text-[0.8rem] font-sans cursor-pointer transition-all rounded-[10px] ${view === "month" ? "glass-surface text-rust font-semibold" : "bg-transparent text-ink-muted"}`}
          >
            月
          </button>
        </div>
        <button
          onClick={handleNext}
          className="absolute right-7 text-[0.9rem] text-ink-muted py-1 px-2 cursor-pointer hover:text-ink transition-colors"
        >
          &gt;
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center"><p className="text-ink-muted text-sm">加载中...</p></div>
      ) : view === "week" ? (
        <WeekView
          weekDays={weekDays}
          entryByDate={entryByDate}
          today={today}
          onDayClick={handleDayClick}
        />
      ) : (
        <MonthView
          year={monthYear.y}
          month={monthYear.m}
          entryByDate={entryByDate}
          today={today}
          onDayClick={handleDayClick}
        />
      )}

      <TabBar active="calendar" />
    </div>
  );
}

/* =========== WEEK VIEW =========== */
function WeekView({
  weekDays, entryByDate, today, onDayClick,
}: {
  weekDays: Date[];
  entryByDate: Map<string, DiaryEntry>;
  today: string;
  onDayClick: (dateStr: string) => void;
}) {
  const startStr = formatDateCN(weekDays[0]).replace("月", "月");
  const endStr = formatDateCN(weekDays[6]);
  const weekLabel = `${startStr} — ${endStr}`;

  return (
    <div className="flex-1 overflow-y-auto flex flex-col justify-center">
      <div className="px-7 py-8 flex flex-col justify-center flex-1">
        <p className="text-[0.85rem] font-semibold text-ink-muted tracking-[0.03em] mb-4">
          {weekLabel}
        </p>
        {weekDays.map((d) => {
          const ds = formatDate(d);
          const entry = entryByDate.get(ds);
          const isToday = ds === today;
          return (
            <button
              key={ds}
              onClick={() => onDayClick(ds)}
              className={`flex items-center py-3.5 border-b border-linen text-left w-full cursor-pointer transition-colors hover:bg-[rgba(196,107,77,0.04)] ${isToday ? "bg-[rgba(196,107,77,0.06)]" : ""}`}
            >
              <span className={`font-mono text-[0.72rem] min-w-[36px] ${isToday ? "text-rust font-semibold" : "text-ink-muted"}`}>
                {String(d.getDate()).padStart(2, "0")}
              </span>
              <span className={`text-[0.72rem] min-w-[28px] ${isToday ? "text-rust font-semibold" : "text-ink-muted"}`}>
                {WEEKDAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1]}
              </span>
              <span className={`w-[6px] h-[6px] rounded-full mr-2 shrink-0 ${entry ? "bg-rust" : "bg-linen"}`} />
              <span className={`flex-1 text-[0.82rem] leading-relaxed font-serif ${entry ? "text-ink" : "text-ink-muted italic text-[0.75rem] font-sans"}`}>
                {entry
                  ? (entry.pinned_gen_idx != null ? entry.generations[entry.pinned_gen_idx]?.summary : entry.generations[entry.generations.length - 1]?.summary) || "—"
                  : "还没有记录"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =========== MONTH VIEW =========== */
function MonthView({
  year, month, entryByDate, today, onDayClick,
}: {
  year: number; month: number; entryByDate: Map<string, DiaryEntry>;
  today: string; onDayClick: (dateStr: string) => void;
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="flex-1 overflow-y-auto flex flex-col justify-center px-4 pb-5">
      <p className="text-center text-[0.9rem] font-semibold text-ink mb-3">{year}年{month + 1}月</p>
      <div className="grid grid-cols-7 text-center text-[0.7rem] text-ink-muted font-medium py-1 pb-2">
        {MONTH_WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const entry = entryByDate.get(ds);
          const isToday = ds === today;
          const summary = entry
            ? (entry.pinned_gen_idx != null ? entry.generations[entry.pinned_gen_idx]?.summary : entry.generations[entry.generations.length - 1]?.summary) || ""
            : "";

          return (
            <button
              key={ds}
              onClick={() => onDayClick(ds)}
              className="flex flex-col items-center justify-start p-0.5 cursor-pointer relative"
              style={{ height: "calc((100vw - 32px) / 7 + 20px)", minHeight: "56px" }}
            >
              <span className={`w-[34px] h-[34px] flex items-center justify-center text-[0.82rem] rounded-full transition-colors ${isToday ? "bg-rust text-white font-semibold" : "text-ink"}`}>
                {day}
              </span>
              <span
                className="text-[0.58rem] text-ink-muted text-center mt-px w-full px-0.5"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  wordBreak: "break-all",
                  lineHeight: "1.25",
                }}
              >
                {summary}
              </span>
              {entry && (
                <span className={`w-[4px] h-[4px] rounded-full absolute top-1 right-1.5 ${isToday ? "bg-white" : "bg-rust"}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =========== DAY DETAIL =========== */
function DayDetailView({ entry, onBack }: { entry: DiaryEntry | null; onBack: () => void }) {
  const dateObj = entry ? new Date(entry.date + "T00:00:00") : new Date();
  const dateFull = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日 ${["星期日","星期一","星期二","星期三","星期四","星期五","星期六"][dateObj.getDay()]}`;
  const pinnedGen = entry && entry.pinned_gen_idx != null ? entry.generations[entry.pinned_gen_idx] : (entry?.generations.length ? entry.generations[entry.generations.length - 1] : null);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-center px-7 py-4 border-b border-linen bg-surface flex-shrink-0 relative">
        <button onClick={onBack} className="absolute left-7 text-sm text-rust font-medium cursor-pointer bg-transparent border-0">&lt; 返回</button>
        <span className="font-serif text-[1.1rem] font-semibold text-ink">{dateFull}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-7 py-5">
        {pinnedGen?.summary && (
          <>
            <p className="text-[0.7rem] text-ink-muted tracking-[0.06em] mb-2">摘要</p>
            <p className="font-serif text-[0.95rem] text-ink leading-[1.9] mb-5">{pinnedGen.summary}</p>
          </>
        )}

        {pinnedGen?.content && (
          <>
            <p className="text-[0.7rem] text-ink-muted tracking-[0.06em] mb-2">日记</p>
            <div className="font-serif text-[0.95rem] leading-[2] text-ink/90 mb-5">
              <ReactMarkdown components={mdComponents}>
                {pinnedGen.content}
              </ReactMarkdown>
            </div>
          </>
        )}

        <p className="text-[0.7rem] text-ink-muted tracking-[0.06em] mb-2">记录片段</p>
        {entry?.raw_notes.map((n, i) => (
          <div key={i} className="flex gap-3.5 py-1.5">
            <span className="text-[0.7rem] text-ink-muted font-mono shrink-0 text-right min-w-[36px]">{n.time}</span>
            <span className="text-sm text-ink/90 leading-relaxed">{n.text}</span>
          </div>
        ))}
        {(!entry || !entry.raw_notes.length) && (
          <p className="text-sm text-ink-muted/50">这一天还没有记录</p>
        )}
      </div>
    </div>
  );
}
