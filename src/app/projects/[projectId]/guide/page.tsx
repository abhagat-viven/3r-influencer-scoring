import { redirect } from "next/navigation";

export default async function GuideIndexPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/projects/${projectId}/guide/getting-started`);
}
