"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useTodayEntry } from "@/hooks/useTodayEntry";
import Timeline from "@/components/Timeline";
import InputBar from "@/components/InputBar";
import DiaryViewer from "@/components/DiaryViewer";
import TabBar from "@/components/TabBar";

export default function HomePage() {
  const { ready } = useAuth();
  const { entry, loading, addNote, removeNote, addGeneration, switchVersion } = useTodayEntry(ready);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!entry || !entry.raw_notes.length) return;
    setGenerating(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        setError("未登录，请刷新页面");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-diary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-gray-300 text-sm">加载中...</div>
      </div>
    );
  }

  const pinnedGen = entry && entry.pinned_gen_idx != null
    ? entry.generations[entry.pinned_gen_idx]
    : null;

  return (
    <div className="page-container">
      <Timeline notes={entry?.raw_notes ?? []} onDelete={removeNote} />
      <InputBar onSave={addNote} />
      <DiaryViewer
        generation={pinnedGen}
        onGenerate={handleGenerate}
        onSwitchVersion={switchVersion}
        allGenerations={entry?.generations ?? []}
        pinnedIdx={entry?.pinned_gen_idx ?? null}
        generating={generating}
        error={error}
        onRetry={handleGenerate}
      />
      <TabBar active="timeline" />
    </div>
  );
}
