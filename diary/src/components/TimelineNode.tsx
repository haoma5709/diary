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
    <div className="relative overflow-hidden">
      <div
        className="flex gap-4 px-[28px] py-3 transition-colors relative z-[1]"
        onTouchStart={handleTouchStart}
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
