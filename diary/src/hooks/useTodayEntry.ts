"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { DiaryEntry, RawNote, Generation } from "@/lib/types";
import { withTimeout } from "@/lib/timeout";

const USER_ID = "ff537d73-4858-4130-aa74-e19fbb575cee";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function useTodayEntry(enabled: boolean = false) {
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchToday = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("diary_entries")
          .select("*")
          .eq("user_id", USER_ID)
          .eq("date", todayStr())
          .maybeSingle(),
        15000
      );

      if (error) console.error("fetch error:", error);
      setEntry(data as DiaryEntry | null);
    } catch (e) {
      console.error("fetch exception:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) fetchToday();
  }, [fetchToday, enabled]);

  const addNote = useCallback(async (text: string) => {
    const note: RawNote = { time: nowTime(), text };
    const date = todayStr();

    if (entry) {
      const newNotes = [...entry.raw_notes, note];
      const { error } = await supabase
        .from("diary_entries")
        .update({ raw_notes: newNotes, updated_at: new Date().toISOString() })
        .eq("id", entry.id);
      if (error) throw error;
      setEntry({ ...entry, raw_notes: newNotes });
    } else {
      const { data, error } = await supabase
        .from("diary_entries")
        .insert({
          user_id: USER_ID,
          date,
          raw_notes: [note],
        })
        .select()
        .single();
      if (error) throw error;
      setEntry(data as DiaryEntry);
    }
  }, [entry]);

  const removeNote = useCallback(async (index: number) => {
    if (!entry) return;
    const newNotes = entry.raw_notes.filter((_, i) => i !== index);
    const { error } = await supabase
      .from("diary_entries")
      .update({ raw_notes: newNotes, updated_at: new Date().toISOString() })
      .eq("id", entry.id);
    if (error) throw error;
    setEntry({ ...entry, raw_notes: newNotes });
  }, [entry]);

  const addGeneration = useCallback(async (content: string, summary: string) => {
    if (!entry) return;
    const gen: Generation = {
      gen_at: new Date().toISOString(),
      content,
      summary,
      raw_snapshot: [...entry.raw_notes],
    };
    const newGens = [...entry.generations, gen];
    const newIdx = newGens.length - 1;
    const { error } = await supabase
      .from("diary_entries")
      .update({ generations: newGens, pinned_gen_idx: newIdx, updated_at: new Date().toISOString() })
      .eq("id", entry.id);
    if (error) throw error;
    setEntry({ ...entry, generations: newGens, pinned_gen_idx: newIdx });
  }, [entry]);

  const switchVersion = useCallback(async (index: number) => {
    if (!entry) return;
    const { error } = await supabase
      .from("diary_entries")
      .update({ pinned_gen_idx: index, updated_at: new Date().toISOString() })
      .eq("id", entry.id);
    if (error) throw error;
    setEntry({ ...entry, pinned_gen_idx: index });
  }, [entry]);

  return {
    entry,
    loading,
    addNote,
    removeNote,
    addGeneration,
    switchVersion,
  };
}
