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
    <div className="fixed-slot bg-white border-t border-gray-200">
      <div className="px-4 py-3">
        {error && (
          <div className="mb-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={onRetry} className="mt-2 text-sm text-red-500 underline">重试</button>
          </div>
        )}

        {generating ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        ) : generation ? (
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {generation.content}
          </div>
        ) : (
          <div className="text-sm text-gray-300 text-center py-4">
            点击下方生成今天的第一篇日记
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <button
            onClick={onGenerate}
            disabled={generating}
            className="flex-1 bg-blue-500 text-white rounded-xl py-2.5 font-medium
                       disabled:opacity-40 disabled:cursor-not-allowed
                       active:bg-blue-600 transition-colors text-sm"
          >
            {generating ? "生成中..." : "生成日记"}
          </button>
          {allGenerations.length > 0 && (
            <button
              onClick={() => setShowVersions(true)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500
                         active:bg-gray-50 transition-colors"
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
