"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Generation } from "@/lib/types";
import VersionPicker from "./VersionPicker";

const mdComponents = {
  h2: ({ children, ...props }: React.ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="text-base font-semibold text-ink font-sans mt-4 mb-2 first:mt-0" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: React.ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="text-sm font-semibold text-rust font-sans mt-3 mb-1.5 first:mt-0" {...props}>{children}</h3>
  ),
  p: ({ children, ...props }: React.ComponentPropsWithoutRef<'p'>) => (
    <p className="mb-2 leading-[1.85]" {...props}>{children}</p>
  ),
  ol: ({ children, ...props }: React.ComponentPropsWithoutRef<'ol'>) => (
    <ol className="list-decimal ml-5 mb-2 space-y-1" {...props}>{children}</ol>
  ),
  ul: ({ children, ...props }: React.ComponentPropsWithoutRef<'ul'>) => (
    <ul className="list-disc ml-5 mb-2 space-y-1" {...props}>{children}</ul>
  ),
  li: ({ children, ...props }: React.ComponentPropsWithoutRef<'li'>) => (
    <li className="leading-[1.85]" {...props}>{children}</li>
  ),
  strong: ({ children, ...props }: React.ComponentPropsWithoutRef<'strong'>) => (
    <strong className="font-semibold" {...props}>{children}</strong>
  ),
};

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
          <div className="text-sm text-ink/90 font-serif overflow-y-auto max-h-[35vh]">
            <ReactMarkdown components={mdComponents}>
              {generation.content}
            </ReactMarkdown>
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
