"use client";

import { useState, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useTodayEntry } from "@/hooks/useTodayEntry";
import TabBar from "@/components/TabBar";
import VersionPicker from "@/components/VersionPicker";

const mdComponents = {
  h2: ({ children, ...props }: React.ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="text-base font-semibold text-ink font-sans mt-4 mb-2 first:mt-0" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: React.ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="text-sm font-semibold text-rust font-sans mt-3 mb-1.5 first:mt-0" {...props}>{children}</h3>
  ),
  p: ({ children, ...props }: React.ComponentPropsWithoutRef<'p'>) => (
    <p className="mb-2" {...props}>{children}</p>
  ),
  ol: ({ children, ...props }: React.ComponentPropsWithoutRef<'ol'>) => (
    <ol className="list-decimal ml-5 mb-2 space-y-1" {...props}>{children}</ol>
  ),
  ul: ({ children, ...props }: React.ComponentPropsWithoutRef<'ul'>) => (
    <ul className="list-disc ml-5 mb-2 space-y-1" {...props}>{children}</ul>
  ),
  li: ({ children, ...props }: React.ComponentPropsWithoutRef<'li'>) => (
    <li className="leading-relaxed" {...props}>{children}</li>
  ),
  strong: ({ children, ...props }: React.ComponentPropsWithoutRef<'strong'>) => (
    <strong className="font-semibold" {...props}>{children}</strong>
  ),
};

export default function DiaryPage() {
  const { ready } = useAuth();
  const { entry, loading, addGeneration, switchVersion } = useTodayEntry(ready);
  const [generating, setGenerating] = useState(false);
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
        return;
      }

      const { content, summary } = await response.json();
      await addGeneration(content, summary);
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
          <div className="space-y-3 animate-pulse">
            <div className="h-3 bg-linen rounded w-3/4" />
            <div className="h-3 bg-linen rounded w-full" />
            <div className="h-3 bg-linen rounded w-2/3" />
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
              先去"记录"中说出今天的想法<br />然后回到这里让 AI 为你整理
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {!editing && (
        <div className="px-7 pt-5 pb-7 flex flex-col gap-3 flex-shrink-0">
          <button
            onClick={handleGenerate}
            disabled={generating || !entry?.raw_notes.length}
            className="w-full bg-rust text-white border-0 rounded-2xl py-3.5 text-[0.9rem] font-semibold font-sans tracking-wide cursor-pointer transition-all duration-200 active:bg-rust-hover active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100"
          >
            {generating ? "生成中..." : "生成日记"}
          </button>
          {entry && entry.generations.length > 0 && (
            <button
              onClick={() => setShowVersions(true)}
              className="w-full text-center text-[0.8rem] font-sans cursor-pointer transition-colors bg-transparent text-ink-muted border-0 py-1 hover:text-ink-light"
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
