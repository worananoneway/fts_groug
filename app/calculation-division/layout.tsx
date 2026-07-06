import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FTS-GROUP | Calculation Division",
  description: "Factory cutting calculation screen for purchase orders, plates, and round bars.",
};

export default function CalculationDivisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

