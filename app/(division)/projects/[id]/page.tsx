import type { Metadata } from "next";

import { ProjectDetailScreen } from "@/components/projects/project-detail-screen";

export const metadata: Metadata = {
  title: "FTS-GROUP | Project",
  description: "รายละเอียดโปรเจคและใบสั่งซื้อภายใต้โปรเจค",
};

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetailScreen projectId={id} />;
}
