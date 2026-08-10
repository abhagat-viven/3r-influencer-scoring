"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Everything except Guide is scoped to the current project (a relative
// segment appended to /projects/[projectId]). Guide is plain informational
// content with no project-specific data, so it lives at a fixed, public
// /guide URL instead — same page whichever project you're in.
const NAV_ITEMS: Array<{ segment: string; label: string } | { href: string; label: string }> = [
  { segment: "", label: "Dashboard" },
  { segment: "/import", label: "Import" },
  { segment: "/pipeline", label: "Pipeline" },
  { segment: "/accounts", label: "Accounts" },
  { segment: "/settings", label: "Settings" },
  { href: "/guide", label: "Guide" },
];

export default function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 text-sm">
      {NAV_ITEMS.map((item) => {
        const href = "href" in item ? item.href : `/projects/${projectId}${item.segment}`;
        const active =
          "href" in item
            ? pathname.startsWith(item.href)
            : item.segment
              ? pathname.startsWith(href)
              : pathname === `/projects/${projectId}`;
        return (
          <Link
            key={item.label}
            href={href}
            {...("href" in item ? { target: "_blank", rel: "noopener noreferrer" } : {})}
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
