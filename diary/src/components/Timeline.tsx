"use client";

import type { RawNote } from "@/lib/types";
import TimelineNode from "./TimelineNode";

interface Props {
  notes: RawNote[];
  onDelete: (index: number) => void;
}

export default function Timeline({ notes, onDelete }: Props) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-ink-muted text-sm gap-1">
        <p className="text-2xl opacity-30">—</p>
        <p>说点什么，开始记录今天</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto flex-1">
      {notes.map((note, i) => (
        <TimelineNode key={`${note.time}-${i}`} time={note.time} text={note.text} onDelete={() => onDelete(i)} />
      ))}
    </div>
  );
}
