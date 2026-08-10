import { notFound } from "next/navigation";
import { getProject, listProjects } from "@/db/queries";
import ProjectSwitcher from "@/components/ProjectSwitcher";
import ProjectNav from "@/components/ProjectNav";

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
        <ProjectNav projectId={projectId} />
        <ProjectSwitcher projects={projects} currentId={projectId} />
      </div>
      {children}
    </div>
  );
}
