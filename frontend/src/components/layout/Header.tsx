"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Bell, Search, MessageSquare, Menu } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  
  const getTitle = () => {
    if (pathname === '/') return 'Dashboard';
    if (pathname === '/network') return 'Network';
    if (pathname === '/pipeline') return 'Pipeline';
    if (pathname === '/compliance') return 'Compliance';
    if (pathname === '/geospatial') return 'Geo-Intel';
    if (pathname === '/settings') return 'Settings';
    return 'Dashboard';
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  return (
    <header className="h-[88px] glass-panel border-b border-slate-200/50 flex items-center justify-between px-10 sticky top-0 z-40 transition-all duration-400 ease-ios">
      
      {/* Left Title */}
      <div>
        <div className="flex items-center gap-4">
          <button className="md:hidden text-slate-400 hover:text-slate-900 transition-colors duration-400 ease-ios">
            <Menu size={24} />
          </button>
          <h2 className="text-2xl font-semibold text-slate-900 tracking-tight leading-none">{getTitle()}</h2>
        </div>
        <p className="text-[10px] font-medium tracking-widest text-slate-400 mt-1.5 uppercase">Durban, South Africa | {currentDate}</p>
      </div>

      {/* Center Search */}
      <div className="hidden md:flex flex-1 max-w-xl mx-8 relative group">
        <input 
          type="text" 
          placeholder="Search something here..." 
          className="w-full bg-white/60 hover:bg-white focus:bg-white backdrop-blur-md border border-slate-200/60 hover:border-slate-300 transition-all duration-400 ease-ios h-[42px] pl-5 pr-12 rounded-full text-sm font-medium text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]/30 placeholder:text-slate-400"
        />
        <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 group-focus-within:text-gradient hover:bg-slate-100/80 transition-all duration-400 ease-ios">
          <Search size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        {/* Notification Bubbles */}
        <div className="flex items-center gap-4 border-r border-slate-200/50 pr-6">
          <button 
            className="relative text-slate-400 hover:text-slate-700 transition-colors group"
            title="Intelligence Logs"
          >
            <MessageSquare size={20} className="text-slate-400 group-hover:text-slate-600 transition-all duration-400 ease-ios" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white/70 shadow-sm"></span>
          </button>
          
          <button className="relative text-slate-400 hover:text-slate-700 transition-colors group">
            <Bell size={20} className="text-slate-400 group-hover:text-slate-600 transition-all duration-400 ease-ios" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#007AFF] rounded-full border-2 border-white/70 shadow-sm animate-pulse"></span>
          </button>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-4 cursor-pointer group">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-slate-900 group-hover:text-gradient transition-colors duration-400 ease-ios">Sarah M.</p>
            <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">Super Admin</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-medium shadow-md shadow-slate-900/10 group-hover:scale-105 transition-transform duration-400 ease-ios">
            SM
          </div>
        </div>
      </div>
    </header>
  );
}
