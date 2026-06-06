"use client";

import type { Generation } from "@/lib/types";

interface Props {
  generations: Generation[];
  pinnedIdx: number | null;
  onSwitch: (index: number) => void;
  onClose: () => void;
}

export default function VersionPicker({ generations, pinnedIdx, onSwitch, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-end justify-center" onClick={onClose}>
      <div className="bg-surface rounded-t-[20px] w-full max-h-72 overflow-y-auto p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-ink-muted mb-4">历史版本</h3>
        {generations.map((gen, i) => (
          <button
            key={i}
            className={`w-full text-left px-4 py-3.5 rounded-2xl mb-2 border transition-colors ${
              i === pinnedIdx ? "border-rust bg-glow" : "border-linen hover:border-linen-strong"
            }`}
            onClick={() => { onSwitch(i); onClose(); }}
          >
            <div className="flex justify-between items-center">
              <span className={`text-sm font-medium ${i === pinnedIdx ? "text-rust" : "text-ink"}`}>
                {gen.summary || `版本 ${i + 1}`}
              </span>
              <span className="text-xs text-ink-muted font-mono">
                {new Date(gen.gen_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </button>
        ))}
        <button
          className="w-full py-3 text-sm text-ink-muted mt-2 font-medium"
          onClick={onClose}
        >
          取消
        </button>
      </div>
    </div>
  );
}
