import GuideNav from "@/components/guide/GuideNav";

export default async function GuideLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="flex gap-10">
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-8">
          <p className="px-3 text-xs font-medium uppercase tracking-wide text-ink-faint mb-2">
            Guide
          </p>
          <GuideNav projectId={projectId} />
        </div>
      </aside>

      <div className="flex-1 min-w-0 max-w-3xl">{children}</div>
    </div>
  );
}
