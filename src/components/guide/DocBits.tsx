import Link from "next/link";

export function DocHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-zinc-500 mt-1">{description}</p>
    </div>
  );
}

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border-l-4 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
      {children}
    </div>
  );
}

export function MockFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">{label}</p>
      {children}
    </div>
  );
}

export function PrevNext({
  prev,
  next,
}: {
  prev?: { href: string; label: string };
  next?: { href: string; label: string };
}) {
  return (
    <div className="mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-sm">
      {prev ? (
        <Link
          href={prev.href}
          className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
        >
          ← {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={next.href}
          className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white text-right"
        >
          {next.label} →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
