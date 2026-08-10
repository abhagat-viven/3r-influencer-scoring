"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const GUIDE_SECTIONS = [
  { slug: "getting-started", label: "Getting started" },
  { slug: "dashboard", label: "Dashboard" },
  { slug: "import", label: "Import" },
  { slug: "pipeline", label: "Pipeline" },
  { slug: "scoring", label: "How scoring works" },
  { slug: "accounts", label: "Accounts" },
  { slug: "settings", label: "Settings" },
  { slug: "api-keys", label: "Bring your own API keys" },
];

export default function GuideNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 text-sm">
      {GUIDE_SECTIONS.map((s) => {
        const href = `/guide/${s.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={s.slug}
            href={href}
            className={
              active
                ? "block rounded-md px-3 py-1.5 bg-primary-soft text-primary-soft-ink font-medium"
                : "block rounded-md px-3 py-1.5 text-ink-soft hover:text-ink hover:bg-surface-muted"
            }
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
