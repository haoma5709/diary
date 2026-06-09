"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTodayEntry } from "@/hooks/useTodayEntry";
import TimelineNode from "@/components/TimelineNode";
import TabBar from "@/components/TabBar";

export default function RecordsPage() {
  const { ready } = useAuth();
  const { entry, loading, addNote, removeNote } = useTodayEntry(ready);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrolledToBottom, setScrolledToBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await addNote(trimmed);
      setText("");
    } finally {
      setSaving(false);
    }
  };

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
    setScrolledToBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 16);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll, entry]);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-ink-muted text-sm">加载中...</div>
        <TabBar active="records" />
      </div>
    );
  }

  const notes = entry?.raw_notes ?? [];

  return (
    <div className="page-container">
      {/* Timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
        {/* Top fade mask */}
        <div
          className="pointer-events-none sticky top-0 left-0 right-0 z-10 h-12 transition-opacity duration-300"
          style={{
            background: "linear-gradient(to bottom, #fbf8f3, transparent)",
            opacity: scrollTop > 0 ? 1 : 0,
          }}
        />

        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-ink-muted/50 text-sm gap-1">
            <p className="text-2xl opacity-20">—</p>
            <p>说点什么，开始记录今天</p>
          </div>
        ) : (
          <div className="relative pt-3.5 pb-2">
            {/* Top line fade */}
            <div
              className="pointer-events-none absolute left-0 right-0 top-0 h-16 z-[1]"
              style={{ background: "linear-gradient(to bottom, #fbf8f3, transparent)" }}
            />
            {/* Bottom line fade */}
            <div
              className="pointer-events-none absolute left-0 right-0 bottom-0 h-16 z-[1]"
              style={{
                background: "linear-gradient(to top, #fbf8f3, transparent)",
                opacity: scrolledToBottom ? 0 : 1,
                transition: "opacity 0.3s",
              }}
            />
            {/* Continuous line through dots */}
            <div
              className="absolute top-2 bottom-2 z-0"
              style={{ left: "calc(28px + 40px + 16px + 3.25px)", width: "1.5px", background: "#c46b4d" }}
            />
            {notes.map((note, i) => (
              <TimelineNode
                key={`${note.time}-${i}`}
                time={note.time}
                text={note.text}
                onDelete={() => removeNote(i)}
                isFirst={i === 0}
              />
            ))}
          </div>
        )}

        {/* Bottom fade mask */}
        <div
          className="pointer-events-none sticky bottom-0 left-0 right-0 z-10 h-12 transition-opacity duration-300"
          style={{
            background: "linear-gradient(to top, #fbf8f3, transparent)",
            opacity: scrolledToBottom ? 0 : 1,
          }}
        />
      </div>

      {/* Input */}
      <div className="fixed-slot bg-surface border-t border-linen pt-1 pb-4 px-5">
        <div className="flex gap-3 items-end">
          <input
            type="text"
            className="flex-1 border-0 border-b border-linen bg-transparent py-2.5 text-[0.9rem] text-ink font-sans leading-relaxed outline-none transition-colors duration-200 focus:border-rust placeholder:text-ink-muted"
            placeholder="说点什么"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
          />
          <button
            onClick={handleSave}
            disabled={!text.trim() || saving}
            className="w-[44px] h-[44px] rounded-full bg-rust border-0 text-white text-lg cursor-pointer flex items-center justify-center shrink-0 transition-all duration-150 active:scale-[0.92] disabled:opacity-30"
          >
            {saving ? "..." : "↑"}
          </button>
        </div>
      </div>

      <TabBar active="records" />
    </div>
  );
}
