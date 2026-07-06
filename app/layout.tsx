import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FTS-GROUP · Steel Sheet Cutting Optimizer",
  description: "ระบบคำนวณการตัดเหล็กแผ่น — Guillotine Packing Algorithm",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        {children}
      </body>
    </html>
  );
}