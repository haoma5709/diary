"use client";

import Link from "next/link";

interface Props {
  active: "records" | "diary" | "calendar";
}

export default function TabBar({ active }: Props) {
  const tabs = [
    { key: "records", href: "/", label: "记录" },
    { key: "diary", href: "/diary", label: "日记" },
    { key: "calendar", href: "/calendar", label: "日历" },
  ] as const;

  return (
    <nav className="fixed-slot flex border-t border-linen bg-surface pb-[env(safe-area-inset-bottom,8px)]">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors duration-150 ${
            active === tab.key ? "text-rust font-semibold" : "text-ink-muted"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
