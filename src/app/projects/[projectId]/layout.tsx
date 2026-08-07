import { notFound } from "next/navigation";
import Link from "next/link";
import { getProject, listProjects } from "@/db/queries";
import ProjectSwitcher from "@/components/ProjectSwitcher";

const NAV_ITEMS = [
  { segment: "", label: "Dashboard" },
  { segment: "/import", label: "Import" },
  { segment: "/pipeline", label: "Pipeline" },
  { segment: "/accounts", label: "Accounts" },
  { segment: "/settings", label: "Settings" },
  { segment: "/guide", label: "Guide" },
];

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const project = getProject(projectId);
  if (!project) notFound();

  const projects = listProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <nav className="flex gap-6 text-sm">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={`/projects/${projectId}${item.segment}`}
              className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <ProjectSwitcher projects={projects} currentId={projectId} />
      </div>
      {children}
    </div>
  );
}
