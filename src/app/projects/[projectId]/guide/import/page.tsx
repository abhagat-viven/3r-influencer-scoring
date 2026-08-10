import { DocHeader, MockFrame, PrevNext } from "@/components/guide/DocBits";
import { ImportMock } from "@/components/guide/mocks/ImportMock";

export default async function ImportGuidePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const base = `/projects/${projectId}/guide`;

  return (
    <div>
      <DocHeader
        title="Import"
        description="Bring creators into a project from a file."
      />

      <div className="text-sm text-ink-soft leading-relaxed space-y-4">
        <p>Three kinds of input are supported:</p>
        <ul className="list-disc list-inside space-y-1.5">
          <li>
            An Instagram <strong>following export</strong> (JSON) — Instagram → Settings →
            Accounts Center → Your information and permissions → Export your information → select
            &quot;Following&quot; only, JSON format.
          </li>
          <li>A plain CSV of handles.</li>
          <li>A rate card, if you&apos;re starting from a list a creator or agency sent you.</li>
        </ul>
        <p>
          Handles already tracked in the project are matched by handle and skipped rather than
          duplicated, so re-uploading an updated export is always safe — it just adds anything new.
        </p>
        <p>
          Rows that match your project&apos;s keyword list are automatically flagged as{" "}
          <strong>candidates</strong> and appear in a shortlist under the uploader, ready to send
          into the Pipeline.
        </p>
      </div>

      <div className="mt-6">
        <MockFrame label="Preview — Import page">
          <ImportMock />
        </MockFrame>
      </div>

      <div className="text-sm text-ink-soft leading-relaxed space-y-4 mt-6">
        <p>
          Files are parsed in memory on upload and never written to disk — only the parsed rows
          are stored, in the project&apos;s database.
        </p>
      </div>

      <PrevNext
        prev={{ href: `${base}/dashboard`, label: "Dashboard" }}
        next={{ href: `${base}/pipeline`, label: "Pipeline" }}
      />
    </div>
  );
}
