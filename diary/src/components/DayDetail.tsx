"use client";

import type { DiaryEntry } from "@/lib/types";

interface Props {
  entry: DiaryEntry;
  onBack: () => void;
}

export default function DayDetail({ entry, onBack }: Props) {
  const pinnedGen = entry.pinned_gen_idx != null ? entry.generations[entry.pinned_gen_idx] : null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <button onClick={onBack} className="text-sm text-blue-500">&lt; 返回</button>
        <span className="text-sm font-medium text-gray-700">{entry.date}</span>
      </div>

      <div className="px-4 py-3 border-b border-gray-50">
        <h4 className="text-xs text-gray-400 mb-2">记录时间线</h4>
        {entry.raw_notes.map((note, i) => (
          <div key={i} className="flex gap-3 py-1.5">
            <span className="text-xs text-gray-400 font-mono shrink-0">{note.time}</span>
            <p className="text-sm text-gray-600">{note.text}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 px-4 py-3 overflow-y-auto">
        <h4 className="text-xs text-gray-400 mb-2">日记</h4>
        {pinnedGen ? (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{pinnedGen.content}</p>
        ) : (
          <p className="text-sm text-gray-300">尚未生成日记</p>
        )}
      </div>
    </div>
  );
}
