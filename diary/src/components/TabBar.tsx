"use client";

import Link from "next/link";

interface Props {
  active: "timeline" | "calendar";
}

export default function TabBar({ active }: Props) {
  return (
    <nav className="fixed-slot flex border-t border-linen bg-surface pb-[env(safe-area-inset-bottom,8px)]">
      <Link
        href="/"
        className={`flex-1 py-3 text-center text-sm font-medium transition-colors duration-150 ${
          active === "timeline" ? "text-rust font-semibold" : "text-ink-muted"
        }`}
      >
        今天
      </Link>
      <Link
        href="/calendar"
        className={`flex-1 py-3 text-center text-sm font-medium transition-colors duration-150 ${
          active === "calendar" ? "text-rust font-semibold" : "text-ink-muted"
        }`}
      >
        日历
      </Link>
    </nav>
  );
}
