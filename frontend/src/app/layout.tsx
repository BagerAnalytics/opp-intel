import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";

export const metadata: Metadata = {
  title: "OppIntel Platform",
  description: "Opportunity Intelligence Platform for Premier Agric & Badger Analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" style={{ zoom: 0.9 }}>
      <body className="bg-[#f5f5f7] text-slate-900 flex antialiased min-h-screen relative">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
