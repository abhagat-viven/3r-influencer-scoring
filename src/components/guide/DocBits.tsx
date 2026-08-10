import Link from "next/link";

export function DocHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      <p className="text-ink-soft mt-1">{description}</p>
    </div>
  );
}

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border-l-4 border-l-primary bg-surface-muted px-4 py-3 text-sm text-ink-soft">
      {children}
    </div>
  );
}

export function MockFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-ink-faint uppercase tracking-wide">{label}</p>
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
    <div className="mt-12 pt-6 border-t border-line flex items-center justify-between text-sm">
      {prev ? (
        <Link href={prev.href} className="text-ink-soft hover:text-ink">
          ← {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.href} className="text-ink-soft hover:text-ink text-right">
          {next.label} →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
