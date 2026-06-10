"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTodayEntry } from "@/hooks/useTodayEntry";
import TimelineNode from "@/components/TimelineNode";
import TabBar from "@/components/TabBar";

function countLines(text: string) {
  return text.split("\n").length;
}

export default function RecordsPage() {
  const { ready } = useAuth();
  const { entry, loading, addNote, removeNote } = useTodayEntry(ready);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrolledToBottom, setScrolledToBottom] = useState(true);
  const [expandMode, setExpandMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 26;
    const maxHeight = lineHeight * 5;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  }, []);

  useEffect(() => { autoResize(); }, [text, autoResize]);

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
        <p className="text-ink-muted text-sm">加载中...</p>
        <TabBar active="records" />
      </div>
    );
  }

  const notes = entry?.raw_notes ?? [];
  const showExpandBtn = countLines(text) > 5;

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
            <p>所学，所思，所行，所想</p>
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
            {/* Swipe hint — independent row above nodes */}
            <div className="px-[28px] py-1.5 flex items-center gap-4">
              <span className="text-[0.7rem] text-ink-muted font-mono min-w-[40px]" />
              <div className="w-2 shrink-0" />
              <span className="text-[0.65rem] text-ink-muted/40">← 左滑可以删除某条记录</span>
            </div>
            {notes.map((note, i) => (
              <TimelineNode
                key={`${note.time}-${i}`}
                time={note.time}
                text={note.text}
                onDelete={() => removeNote(i)}
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

      {/* Input — WeChat-style auto-expanding textarea */}
      <div className="fixed-slot bg-surface border-t border-linen pt-2 pb-4 px-5">
        <div className="flex gap-2 items-end">
          {showExpandBtn && (
            <button
              onClick={() => setExpandMode(true)}
              className="w-[36px] h-[36px] rounded-lg border border-linen flex items-center justify-center text-ink-muted text-base shrink-0 mb-2 active:bg-linen transition-colors cursor-pointer bg-transparent"
              aria-label="全屏输入"
            >
              ⤢
            </button>
          )}
          <textarea
            ref={textareaRef}
            className="flex-1 border-0 border-b border-linen bg-transparent py-2.5 text-[0.9rem] text-ink font-sans leading-relaxed outline-none transition-colors duration-200 focus:border-rust placeholder:text-ink-muted resize-none"
            placeholder="说点什么"
            rows={2}
            value={text}
            onChange={(e) => { setText(e.target.value); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
            }}
          />
          <button
            onClick={handleSave}
            disabled={!text.trim() || saving}
            className="w-[44px] h-[44px] rounded-full bg-rust border-0 text-white text-lg cursor-pointer flex items-center justify-center shrink-0 transition-all duration-150 active:scale-[0.92] disabled:opacity-30 mb-0.5"
          >
            {saving ? "···" : "↑"}
          </button>
        </div>
      </div>

      {/* Fullscreen input modal */}
      {expandMode && (
        <div className="fixed inset-0 z-50 bg-paper flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-linen flex-shrink-0">
            <button
              onClick={() => setExpandMode(false)}
              className="text-sm text-ink-muted cursor-pointer bg-transparent border-0"
            >
              取消
            </button>
            <span className="text-sm font-medium text-ink">全屏输入</span>
            <button
              onClick={() => { handleSave(); setExpandMode(false); }}
              disabled={!text.trim() || saving}
              className="text-sm text-rust font-semibold cursor-pointer bg-transparent border-0 disabled:opacity-30"
            >
              完成
            </button>
          </div>
          <textarea
            className="flex-1 w-full bg-transparent border-0 p-5 text-[0.95rem] text-ink font-sans leading-relaxed outline-none resize-none"
            placeholder="说点什么"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
        </div>
      )}

      <TabBar active="records" />
    </div>
  );
}
