"use client";

import Link from "next/link";

interface Props {
  active: "timeline" | "calendar";
}

export default function TabBar({ active }: Props) {
  return (
    <nav className="fixed-slot flex border-t border-gray-100 bg-white">
      <Link
        href="/"
        className={`flex-1 py-3 text-center text-sm ${
          active === "timeline" ? "text-blue-500 font-medium" : "text-gray-400"
        }`}
      >
        时间线
      </Link>
      <Link
        href="/calendar"
        className={`flex-1 py-3 text-center text-sm ${
          active === "calendar" ? "text-blue-500 font-medium" : "text-gray-400"
        }`}
      >
        日历
      </Link>
    </nav>
  );
}
