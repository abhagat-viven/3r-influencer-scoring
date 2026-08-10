"use client";

import { useTransition } from "react";
import { exportCandidatesCsv } from "@/app/actions";

export default function ExportCsvButton({
  projectId,
  className,
}: {
  projectId: string;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const csv = await exportCandidatesCsv(projectId);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `influencer-candidates-${date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  return (
    <button
      onClick={handleExport}
      disabled={isPending}
      className={
        className ??
        "rounded-md border border-line text-ink hover:bg-surface-muted px-3 py-1.5 text-sm font-medium disabled:opacity-50"
      }
    >
      {isPending ? "Exporting…" : "Export CSV"}
    </button>
  );
}
