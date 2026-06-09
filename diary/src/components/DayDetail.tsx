"use client";

import type { DiaryEntry } from "@/lib/types";

interface Props {
  entry: DiaryEntry;
  onBack: () => void;
}

export default function DayDetail({ entry, onBack }: Props) {
  const pinnedGen = entry.pinned_gen_idx != null ? entry.generations[entry.pinned_gen_idx] : null;

  return (
    <div className="h-full flex flex-col bg-paper">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-linen bg-surface flex-shrink-0">
        <button onClick={onBack} className="text-sm text-rust font-medium">&lt; 返回</button>
        <span className="text-sm font-semibold text-ink">{entry.date}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-4 border-b border-linen">
          <h4 className="text-xs text-ink-muted font-medium mb-3 tracking-wide">记录</h4>
          {entry.raw_notes.map((note, i) => (
            <div key={i} className="flex gap-3.5 py-1.5">
              <span className="text-xs text-ink-muted font-mono shrink-0">{note.time}</span>
              <p className="text-sm text-ink/90 leading-relaxed">{note.text}</p>
            </div>
          ))}
        </div>

        <div className="px-5 py-4">
          <h4 className="text-xs text-ink-muted font-medium mb-3 tracking-wide">日记</h4>
          {pinnedGen ? (
            <p className="text-sm text-ink/90 leading-[1.85] whitespace-pre-wrap font-serif">{pinnedGen.content}</p>
          ) : (
            <p className="text-sm text-ink-muted/50">尚未生成日记</p>
          )}
        </div>
      </div>
    </div>
  );
}
