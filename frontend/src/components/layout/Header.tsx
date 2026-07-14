"use client";
import { useState } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";

export default function Header() {
  const [isScraping, setIsScraping] = useState(false);

  const runScrapers = async () => {
    setIsScraping(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.post(`${apiUrl}/api/scrapers/run`);
      // Give it a second to finish
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Failed to run scrapers", error);
      setIsScraping(false);
    }
  };

  return (
    <header className="h-16 glass-panel border-b-0 border-white/5 flex items-center justify-between px-8 sticky top-0 z-10 w-full backdrop-blur-xl bg-black/40">
      <h2 className="text-lg font-semibold text-white">Overview</h2>
      <div className="flex items-center gap-4">
        <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
          Sync NAS Data
        </button>
        <button 
          onClick={runScrapers}
          disabled={isScraping}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.5)]"
        >
          {isScraping && <Loader2 className="w-4 h-4 animate-spin" />}
          {isScraping ? "Running..." : "Run Scrapers"}
        </button>
      </div>
    </header>
  );
}
