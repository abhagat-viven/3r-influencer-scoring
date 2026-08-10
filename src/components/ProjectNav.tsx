"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { segment: "", label: "Dashboard" },
  { segment: "/import", label: "Import" },
  { segment: "/pipeline", label: "Pipeline" },
  { segment: "/accounts", label: "Accounts" },
  { segment: "/settings", label: "Settings" },
  { segment: "/guide", label: "Guide" },
];

export default function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 text-sm">
      {NAV_ITEMS.map((item) => {
        const href = `/projects/${projectId}${item.segment}`;
        const active = item.segment
          ? pathname.startsWith(href)
          : pathname === `/projects/${projectId}`;
        return (
          <Link
            key={item.label}
            href={href}
            className={
              active
                ? "rounded-md px-3 py-1.5 bg-primary-soft text-primary-soft-ink font-medium"
                : "rounded-md px-3 py-1.5 text-ink-soft hover:text-ink hover:bg-surface-muted"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
