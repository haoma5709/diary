"use client";

import { useState, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useTodayEntry } from "@/hooks/useTodayEntry";
import TabBar from "@/components/TabBar";
import VersionPicker from "@/components/VersionPicker";
import { mdComponents } from "@/lib/markdown";

export default function DiaryPage() {
  const { ready } = useAuth();
  const { entry, loading, addGeneration, switchVersion } = useTodayEntry(ready);
  const [generating, setGenerating] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [showVersions, setShowVersions] = useState(false);

  const pinnedGen = entry && entry.pinned_gen_idx != null
    ? entry.generations[entry.pinned_gen_idx]
    : null;

  useEffect(() => {
    if (pinnedGen && !editing) {
      setEditText(pinnedGen.content);
    }
  }, [pinnedGen, editing]);

  const handleGenerate = useCallback(async () => {
    if (!entry || !entry.raw_notes.length) return;
    setGenerating(true);
    setError(null);
    setStreamText("");

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) { setError("未登录，请刷新页面"); return; }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-diary`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ rawNotes: entry.raw_notes }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        setError(err.error ?? "生成失败，请稍后重试");
        setGenerating(false);
        return;
      }

      // Consume SSE — server parsed JSON, sends clean content chunks + summary
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let contentAcc = "";
      let summaryAcc = "";
      let receiveDone = false;

      // Background: read all SSE events
      const readPromise = (async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { receiveDone = true; break; }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") { receiveDone = true; break; }
            try {
              const msg = JSON.parse(raw);
              if (msg.type === "chunk") contentAcc += msg.text;
              else if (msg.type === "summary") summaryAcc = msg.text;
            } catch { /* skip */ }
          }
          if (receiveDone) break;
        }
      })();

      // Display: reveal accumulated content with accelerating speed
      let displayPos = 0;
      await new Promise<void>((resolve) => {
        const tick = () => {
          const total = contentAcc.length;
          // Resolve only when receive is done AND display caught up
          if (displayPos >= total && receiveDone) { resolve(); return; }
          if (total === 0) { setTimeout(tick, 30); return; }

          const progress = displayPos / Math.max(total, 200);
          const speed = Math.max(8, 40 - progress * 34); // 40→8ms
          const step = Math.max(1, Math.floor((total - displayPos) / 15));
          displayPos = Math.min(total, displayPos + step);
          setStreamText(contentAcc.slice(0, displayPos));
          setTimeout(tick, speed);
        };
        tick();
      });

      // Ensure final content is displayed
      setStreamText(contentAcc);

      if (!contentAcc) {
        setError("AI 返回内容为空，请重试");
        setGenerating(false);
        return;
      }

      await addGeneration(contentAcc, summaryAcc);
      setStreamText("");
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setGenerating(false);
    }
  }, [entry, addGeneration]);

  const handleSaveEdit = async () => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    await addGeneration(trimmed, pinnedGen?.summary ?? "");
    setEditing(false);
  };

  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const dateFull = `${dateStr} ${weekdays[today.getDay()]}`;

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <p className="text-ink-muted text-sm">加载中...</p>
        <TabBar active="diary" />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="px-7 pt-10 pb-0 flex-shrink-0">
        <h1 className="font-serif text-[1.8rem] font-bold text-ink tracking-[0.03em]">
          {dateFull}
        </h1>
        <div className="w-full h-[2px] bg-rust mt-3.5 mb-5" />
        {pinnedGen?.summary && (
          <p className="text-[0.85rem] text-rust font-medium mb-7">{pinnedGen.summary}</p>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-7">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={handleGenerate} className="mt-2 text-sm text-red-500 underline">重试</button>
          </div>
        )}

        {generating ? (
          <div className="font-serif text-[0.95rem] leading-[2] text-ink/90">
            {streamText ? (
              <ReactMarkdown components={mdComponents}>
                {streamText}
              </ReactMarkdown>
            ) : (
              <span className="inline-block w-2 h-4 bg-rust/60 animate-pulse rounded-sm align-middle" />
            )}
            {streamText && (
              <span className="inline-block w-2 h-4 bg-rust/60 animate-pulse rounded-sm align-middle ml-0.5" />
            )}
          </div>
        ) : editing ? (
          /* Edit mode */
          <div>
            <textarea
              className="w-full min-h-[280px] border-0 bg-transparent font-serif text-[0.95rem] leading-[2] text-ink resize-y outline-none p-0"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSaveEdit}
                className="bg-rust text-white border-0 py-2.5 px-6 rounded-[20px] text-[0.82rem] font-semibold font-sans cursor-pointer transition-transform active:scale-[0.96]"
              >
                保存
              </button>
              <button
                onClick={() => { setEditing(false); setEditText(pinnedGen?.content ?? ""); }}
                className="bg-transparent text-ink-muted border-0 py-2.5 px-4 text-[0.82rem] font-sans cursor-pointer"
              >
                取消
              </button>
            </div>
          </div>
        ) : pinnedGen ? (
          /* Read mode */
          <div>
            <div className="font-serif text-[0.95rem] leading-[2] text-ink/90">
              <ReactMarkdown components={mdComponents}>
                {pinnedGen.content}
              </ReactMarkdown>
            </div>
            <button
              onClick={() => { setEditing(true); setEditText(pinnedGen.content); }}
              className="inline-flex items-center gap-1 font-sans text-[0.75rem] text-ink-muted cursor-pointer py-1 mt-3 transition-colors hover:text-rust"
            >
              编辑
            </button>
          </div>
        ) : entry && entry.raw_notes.length > 0 ? (
          /* Has notes but no diary yet */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-2xl opacity-20 mb-4">—</p>
            <p className="font-serif text-[1.1rem] text-ink mb-1.5">还没有生成日记</p>
            <p className="text-[0.85rem] text-ink-muted leading-relaxed">
              你在"记录"中已经有 {entry.raw_notes.length} 条片段了<br />点击下方按钮让 AI 为你整理成文
            </p>
          </div>
        ) : (
          /* No notes at all */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-2xl opacity-20 mb-4">—</p>
            <p className="font-serif text-[1.1rem] text-ink mb-1.5">今天还没有记录</p>
            <p className="text-[0.85rem] text-ink-muted leading-relaxed">
成文
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {!editing && (
        <div className="px-7 pt-5 pb-7 flex flex-col items-center gap-4 flex-shrink-0">
          <button
            onClick={handleGenerate}
            disabled={generating || !entry?.raw_notes.length}
            className="glass-warm px-10 py-2.5 rounded-full text-[0.85rem] font-medium font-sans tracking-[0.02em] cursor-pointer transition-all duration-200 text-rust active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100"
          >
            {generating ? "生成中..." : "生成日记"}
          </button>
          {entry && entry.generations.length > 0 && (
            <button
              onClick={() => setShowVersions(true)}
              className="text-center text-[0.78rem] font-sans cursor-pointer transition-colors bg-transparent text-ink-muted border-0 py-0.5 hover:text-ink-light"
            >
              历史版本
            </button>
          )}
        </div>
      )}

      {showVersions && (
        <VersionPicker
          generations={entry?.generations ?? []}
          pinnedIdx={entry?.pinned_gen_idx ?? null}
          onSwitch={(i) => { switchVersion(i); setShowVersions(false); }}
          onClose={() => setShowVersions(false)}
        />
      )}

      <TabBar active="diary" />
    </div>
  );
}
