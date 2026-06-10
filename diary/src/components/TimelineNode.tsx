"use client";

import { useState, useRef, useCallback } from "react";

interface Props {
  time: string;
  text: string;
  onDelete: () => void;
}

export default function TimelineNode({ time, text, onDelete }: Props) {
  const [dragX, setDragX] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (deleting) return;
    startX.current = e.touches[0].clientX;
    currentX.current = 0;
  }, [deleting]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (deleting) return;
    const dx = e.touches[0].clientX - startX.current;
    currentX.current = Math.min(0, dx);
    const resisted = currentX.current < -80
      ? -80 - Math.sqrt(-(currentX.current + 80)) * 2
      : currentX.current;
    setDragX(resisted);
  }, [deleting]);

  const handleTouchEnd = useCallback(() => {
    if (deleting) return;
    if (currentX.current < -80) {
      setDeleting(true);
      setTimeout(() => onDelete(), 250);
    } else {
      setDragX(0);
    }
  }, [deleting, onDelete]);

  return (
    <div
      className="relative overflow-hidden transition-all duration-300 ease-out"
      style={{
        maxHeight: deleting ? "0px" : "600px",
        marginBottom: deleting ? "0px" : undefined,
        opacity: deleting ? 0 : 1,
        transition: deleting ? "max-height 0.25s ease-in, opacity 0.25s ease-in, margin-bottom 0.25s ease-in" : undefined,
      }}
    >
      {/* Red delete background */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end pr-5 bg-rust/10 transition-opacity duration-200"
        style={{ opacity: dragX < -20 ? Math.min(1, Math.abs(dragX) / 80) : 0 }}
      >
        <span className="text-rust text-xs font-medium">删除</span>
      </div>

      {/* Swipeable content */}
      <div
        className="flex gap-4 px-[28px] py-3 relative z-[1] select-none"
        style={{
          transform: deleting ? "translateX(-120%)" : `translateX(${dragX}px)`,
          opacity: deleting ? 0 : 1,
          transition: deleting
            ? "transform 0.2s ease-in, opacity 0.2s ease-in"
            : dragX === 0
              ? "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)"
              : "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <span className="text-[0.7rem] text-ink-muted font-mono pt-0.5 shrink-0 text-right min-w-[40px]">
          {time}
        </span>
        <div className="flex flex-col items-center w-2 shrink-0 relative z-[1]">
          <div className="w-2 h-2 rounded-full bg-rust shrink-0 mt-0.5" />
        </div>
        <p className="text-[0.88rem] text-ink/90 leading-relaxed flex-1 pb-2 font-serif">
          {text}
        </p>
      </div>
    </div>
  );
}
