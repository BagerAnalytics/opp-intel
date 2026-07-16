"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Bell, ChevronDown, Loader2 } from "lucide-react";

export default function Header() {
  const [progress, setProgress] = useState<{is_active: boolean, current_task: string, progress_percent: number}>({
    is_active: false,
    current_task: "Idle",
    progress_percent: 0
  });

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await axios.get(`${apiUrl}/api/scrapers/progress`);
        setProgress(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    
    // Poll every 2 seconds
    const interval = setInterval(fetchProgress, 2000);
    fetchProgress();
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-20 flex items-center justify-between px-8 z-10 w-full mt-2">
      {/* Scraper Progress Bar (Replaces Search) */}
      <div className="flex-1 max-w-2xl transition-all duration-500">
        {progress.is_active ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm font-semibold text-emerald-400">
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span>{progress.current_task}</span>
              </div>
              <span>{progress.progress_percent}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${progress.progress_percent}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm font-bold tracking-widest uppercase text-slate-500 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            System Online
          </div>
        )}
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1e2029]/80 border border-white/5 text-gray-400 hover:text-white transition-colors">
          <Bell size={18} />
        </button>
        
        <button className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#1e2029]/80 border border-white/5 hover:bg-white/5 transition-colors">
          <img 
            src="https://ui-avatars.com/api/?name=Admin&background=random" 
            alt="Admin" 
            className="w-7 h-7 rounded-full object-cover"
          />
          <span className="text-sm font-medium text-white pr-2">Admin</span>
          <ChevronDown size={14} className="text-gray-400" />
        </button>
      </div>
    </header>
  );
}
