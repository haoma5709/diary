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
    <div className="fixed-slot bg-white border-t border-b border-gray-100">
      <div className="px-4 py-3">
        <textarea
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base
                     resize-none focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                     placeholder-gray-400"
          rows={2}
          placeholder="点这里，用键盘语音输入..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          onClick={handleSave}
          disabled={!text.trim() || saving}
          className="mt-2 w-full bg-blue-500 text-white rounded-xl py-2.5
                     font-medium disabled:opacity-40 disabled:cursor-not-allowed
                     active:bg-blue-600 transition-colors"
        >
          {saving ? "保存中..." : "保存片段"}
        </button>
      </div>
    </div>
  );
}
