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
      <body className={`${hanken.className} bg-[#0c0d11] text-gray-200 flex antialiased min-h-screen relative`}>
        {/* Ambient background blur elements mimicking the mockup */}
        <div className="fixed top-0 left-0 w-[40vw] h-[100vh] bg-blue-900/10 blur-[150px] -z-10 pointer-events-none rounded-full transform -translate-x-1/2"></div>
        <div className="fixed bottom-0 right-0 w-[40vw] h-[80vh] bg-purple-900/10 blur-[150px] -z-10 pointer-events-none rounded-full transform translate-x-1/4 translate-y-1/4"></div>
        
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 px-8 pb-8 relative z-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
