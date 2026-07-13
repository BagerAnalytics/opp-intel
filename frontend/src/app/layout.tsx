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
    <html lang="en">
      <body className={`${hanken.className} bg-[#f8faf9] text-[#061b0e] flex`}>
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
