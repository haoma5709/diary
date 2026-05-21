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
      <div className="flex flex-col items-center justify-center h-full text-gray-300 text-sm">
        <p>还没有记录</p>
        <p className="mt-1">在下方输入框说出今天的想法</p>
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
