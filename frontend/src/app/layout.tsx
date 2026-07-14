import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

const hanken = Hanken_Grotesk({ subsets: ["latin"] });

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
    <html lang="en" className="dark">
      <body className={`${hanken.className} bg-background text-foreground flex antialiased`}>
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col min-h-screen bg-[url('/grid-bg.svg')] bg-[length:30px_30px] bg-fixed">
          <div className="absolute inset-0 bg-black/80 pointer-events-none -z-10" />
          <Header />
          <main className="flex-1 p-8 relative z-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
