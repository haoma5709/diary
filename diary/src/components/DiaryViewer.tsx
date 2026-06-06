"use client";

import { useState } from "react";
import type { Generation } from "@/lib/types";
import VersionPicker from "./VersionPicker";

interface Props {
  generation: Generation | null;
  onGenerate: () => Promise<void>;
  onSwitchVersion: (index: number) => void;
  allGenerations: Generation[];
  pinnedIdx: number | null;
  generating: boolean;
  error: string | null;
  onRetry: () => void;
}

export default function DiaryViewer({
  generation, onGenerate, onSwitchVersion,
  allGenerations, pinnedIdx, generating, error, onRetry,
}: Props) {
  const [showVersions, setShowVersions] = useState(false);

  return (
    <div className="fixed-slot bg-surface border-t border-linen">
      <div className="px-5 py-4">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={onRetry} className="mt-2 text-sm text-red-500 underline">重试</button>
          </div>
        )}

        {generating ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-3 bg-linen rounded w-3/4" />
            <div className="h-3 bg-linen rounded w-full" />
            <div className="h-3 bg-linen rounded w-2/3" />
          </div>
        ) : generation ? (
          <div className="text-sm text-ink/90 leading-[1.85] whitespace-pre-wrap font-serif">
            {generation.content}
          </div>
        ) : (
          <div className="text-sm text-ink-muted/60 text-center py-6 font-sans">
            点击下方生成今天的第一篇日记
          </div>
        )}

        <div className="flex gap-2.5 mt-4">
          <button
            onClick={onGenerate}
            disabled={generating}
            className="flex-1 bg-rust text-white rounded-2xl py-3 font-semibold
                       disabled:opacity-35 disabled:cursor-not-allowed
                       active:bg-rust-hover active:scale-[0.98] transition-all duration-150 text-sm tracking-wide"
          >
            {generating ? "生成中..." : "生成日记"}
          </button>
          {allGenerations.length > 0 && (
            <button
              onClick={() => setShowVersions(true)}
              className="px-4 py-3 border border-linen rounded-2xl text-sm text-ink-light
                         active:bg-linen transition-colors font-medium"
            >
              查看版本
            </button>
          )}
        </div>
      </div>

      {showVersions && (
        <VersionPicker
          generations={allGenerations}
          pinnedIdx={pinnedIdx}
          onSwitch={onSwitchVersion}
          onClose={() => setShowVersions(false)}
        />
      )}
    </div>
  );
}
