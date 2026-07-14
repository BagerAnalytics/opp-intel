"use client";
import { useState } from "react";
import axios from "axios";
import { Search, Bell, ChevronDown } from "lucide-react";

export default function Header() {
  return (
    <header className="h-20 flex items-center justify-between px-8 z-10 w-full mt-2">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative flex items-center">
          <Search className="absolute left-4 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full bg-[#1e2029]/80 border border-white/5 rounded-xl py-2.5 pl-12 pr-4 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4352ff]/50"
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1e2029]/80 border border-white/5 text-gray-400 hover:text-white transition-colors">
          <Bell size={18} />
        </button>
        
        <button className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#1e2029]/80 border border-white/5 hover:bg-white/5 transition-colors">
          <img 
            src="https://ui-avatars.com/api/?name=Sarah+J&background=random" 
            alt="Sarah J" 
            className="w-7 h-7 rounded-full object-cover"
          />
          <span className="text-sm font-medium text-white pr-2">Sarah J.</span>
          <ChevronDown size={14} className="text-gray-400" />
        </button>
      </div>
    </header>
  );
}
