import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { RouteTransitionProvider } from "@/components/loading/route-transition";

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
        <LanguageProvider>
          <RouteTransitionProvider>{children}</RouteTransitionProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
