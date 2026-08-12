"use client";
import { useState, useEffect, useRef } from "react";
import { Bell, Search, MessageSquare, Menu, LogOut, User as UserIcon, Activity } from "lucide-react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{name: string, role: string, email: string} | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [progress, setProgress] = useState({ is_active: false, progress_percent: 0, current_task: 'Idle' });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchProgress = async () => {
      try {
        const res = await fetch('https://opp-intel-production.up.railway.app/api/scrapers/progress');
        const data = await res.json();
        setProgress(data);
      } catch (e) {
        console.error('Failed to fetch progress');
      }
    };
    
    // Only poll aggressively if the logs dropdown is actually open, otherwise poll slowly or just once
    if (showLogs) {
      fetchProgress();
      interval = setInterval(fetchProgress, 2000);
    } else {
      fetchProgress();
      interval = setInterval(fetchProgress, 10000);
    }
    
    return () => clearInterval(interval);
  }, [showLogs]);

  const notifRef = useRef<HTMLDivElement>(null);
  const logsRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    try {
      const stored = localStorage.getItem('oppintel_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {}

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (logsRef.current && !logsRef.current.contains(event.target as Node)) {
        setShowLogs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('oppintel_token');
    localStorage.removeItem('oppintel_user');
    router.push('/login');
  };

  const handleNotificationClick = () => {
    alert("You have no new notifications at this time.");
  };
  
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

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

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
          
          {/* Intelligence Logs */}
          <div className="relative" ref={logsRef}>
            <button 
              onClick={() => setShowLogs(!showLogs)}
              className="relative text-slate-400 hover:text-slate-700 transition-colors group"
              title="Intelligence Logs"
            >
              <MessageSquare size={20} className="text-slate-400 group-hover:text-slate-600 transition-all duration-400 ease-ios" />
            </button>
            
            {showLogs && (
              <div className="absolute right-0 mt-3 w-80 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-xl shadow-lg shadow-slate-200/50 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">Intelligence Logs</h3>
                </div>
                <div className="p-4">
                  {progress.is_active ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Activity size={16} className="text-emerald-500 animate-pulse" />
                        <span className="text-sm font-medium text-emerald-600">Engine Active</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full transition-all duration-500" style={{width: `${progress.progress_percent}%`}}></div>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-emerald-400 mt-2 break-words">
                        {">"} {progress.current_task}
                        <span className="animate-pulse">_</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <MessageSquare size={24} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-sm font-medium text-slate-600">No active logs</p>
                      <p className="text-xs text-slate-400 mt-1">The AI engine is currently idle.</p>
                      {progress.current_task && progress.current_task !== 'Idle' && (
                        <div className="mt-4 p-2 bg-slate-50 border border-slate-100 rounded text-xs text-slate-500 font-mono text-left break-words">
                          Last log: {progress.current_task}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)} 
              className="relative text-slate-400 hover:text-slate-700 transition-colors group"
            >
              <Bell size={20} className="text-slate-400 group-hover:text-slate-600 transition-all duration-400 ease-ios" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-xl shadow-lg shadow-slate-200/50 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                  <span className="text-xs font-medium text-[#007AFF] bg-[#007AFF]/10 px-2 py-0.5 rounded-full">0 New</span>
                </div>
                <div className="p-6 text-center">
                  <Bell size={24} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-600">You're all caught up!</p>
                  <p className="text-xs text-slate-400 mt-1">New opportunities will be emailed to you.</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Profile */}
        <div className="relative" ref={menuRef}>
          <div 
            className="flex items-center gap-4 cursor-pointer group"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-slate-900 group-hover:text-gradient transition-colors duration-400 ease-ios">
                {user?.name || "User"}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">
                {user?.role || "Member"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-medium shadow-md shadow-slate-900/10 group-hover:scale-105 transition-transform duration-400 ease-ios">
              {getInitials(user?.name || "")}
            </div>
          </div>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-48 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-xl shadow-lg shadow-slate-200/50 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Account</p>
                <p className="text-sm text-slate-800 font-medium truncate mt-0.5">{user?.email || "No email"}</p>
              </div>
              <button 
                onClick={() => router.push('/settings')}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#007AFF] transition-colors flex items-center gap-2"
              >
                <UserIcon size={16} />
                Profile Settings
              </button>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
