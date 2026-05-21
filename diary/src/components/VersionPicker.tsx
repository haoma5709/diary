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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full max-h-72 overflow-y-auto p-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-medium text-gray-500 mb-3">历史版本</h3>
        {generations.map((gen, i) => (
          <button
            key={i}
            className={`w-full text-left px-4 py-3 rounded-xl mb-2 border ${
              i === pinnedIdx ? "border-blue-300 bg-blue-50" : "border-gray-100"
            }`}
            onClick={() => { onSwitch(i); onClose(); }}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-800">{gen.summary || `版本 ${i + 1}`}</span>
              <span className="text-xs text-gray-400">
                {new Date(gen.gen_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </button>
        ))}
        <button
          className="w-full py-3 text-sm text-gray-400 mt-2"
          onClick={onClose}
        >
          取消
        </button>
      </div>
    </div>
  );
}
