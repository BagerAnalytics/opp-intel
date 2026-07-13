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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10 w-full">
      <h2 className="text-lg font-semibold text-gray-800">Overview</h2>
      <div className="flex items-center gap-4">
        <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">
          Sync NAS Data
        </button>
        <button 
          onClick={runScrapers}
          disabled={isScraping}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isScraping && <Loader2 className="w-4 h-4 animate-spin" />}
          {isScraping ? "Running..." : "Run Scrapers"}
        </button>
      </div>
    </header>
  );
}
