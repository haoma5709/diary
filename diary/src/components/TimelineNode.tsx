"use client";

interface Props {
  time: string;
  text: string;
  onDelete: () => void;
}

export default function TimelineNode({ time, text, onDelete }: Props) {
  const handleTouchStart = (e: React.TouchEvent) => {
    const startX = e.touches[0].clientX;
    const el = e.currentTarget as HTMLElement;

    const onMove = (ev: TouchEvent) => {
      const dx = ev.touches[0].clientX - startX;
      if (dx < -60) {
        el.style.transform = "translateX(-60px)";
      }
    };

    const onEnd = (ev: TouchEvent) => {
      const dx = ev.changedTouches[0].clientX - startX;
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      if (dx < -80) {
        onDelete();
      } else {
        el.style.transform = "translateX(0)";
      }
    };

    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd, { once: true });
  };

  return (
    <div className="relative overflow-hidden px-5 py-3.5 border-b border-linen transition-colors" onTouchStart={handleTouchStart}>
      <div className="absolute right-5 top-0 bottom-0 flex items-center text-white text-sm opacity-0">
        <span>删除</span>
      </div>
      <div className="flex gap-3.5">
        <span className="text-xs text-ink-muted font-mono pt-0.5 shrink-0">{time}</span>
        <p className="text-sm text-ink/90 flex-1 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
