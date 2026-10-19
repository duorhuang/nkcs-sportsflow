import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "NKCS SportsFlow | 球队战术与综合竞技管理平台",
  description:
    "NKCS Athletics Legacy, Tactics Playbook, Precision Training Schedules, and Recovery Hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" className="dark">
      <body className="bg-[#0A1A14] text-white selection:bg-heritage-gold/30 selection:text-white">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
