import type { Metadata } from "next";

import { ProjectsScreen } from "@/components/projects/projects-screen";

export const metadata: Metadata = {
  title: "FTS-GROUP | Projects",
  description: "โปรเจคของลูกค้าและใบสั่งซื้อภายใต้โปรเจค",
};

export default function ProjectsPage() {
  return <ProjectsScreen />;
}
