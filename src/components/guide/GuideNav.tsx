"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const GUIDE_SECTIONS = [
  { slug: "getting-started", label: "Getting started" },
  { slug: "dashboard", label: "Dashboard" },
  { slug: "import", label: "Import" },
  { slug: "pipeline", label: "Pipeline" },
  { slug: "accounts", label: "Accounts" },
  { slug: "settings", label: "Settings" },
  { slug: "api-keys", label: "Bring your own API keys" },
];

export default function GuideNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 text-sm">
      {GUIDE_SECTIONS.map((s) => {
        const href = `/projects/${projectId}/guide/${s.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={s.slug}
            href={href}
            className={
              active
                ? "block rounded-md px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white font-medium"
                : "block rounded-md px-3 py-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800"
            }
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
