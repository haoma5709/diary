"use client";

import { useState } from "react";

interface Props {
  onSave: (text: string) => Promise<void>;
}

export default function InputBar({ onSave }: Props) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await onSave(trimmed);
      setText("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed-slot bg-surface border-t border-linen border-b">
      <div className="px-5 py-3">
        <textarea
          className="w-full border border-linen rounded-2xl px-4 py-3 text-base
                     resize-none focus:outline-none focus:border-rust focus:ring-[3px] focus:ring-rust/10
                     placeholder:text-ink-muted bg-paper text-ink font-sans leading-relaxed"
          rows={2}
          placeholder="说点什么"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          onClick={handleSave}
          disabled={!text.trim() || saving}
          className="mt-2 w-full bg-rust text-white rounded-2xl py-3
                     font-semibold disabled:opacity-35 disabled:cursor-not-allowed
                     active:bg-rust-hover active:scale-[0.98] transition-all duration-150 text-sm tracking-wide"
        >
          {saving ? "保存中..." : "说完了"}
        </button>
      </div>
    </div>
  );
}
