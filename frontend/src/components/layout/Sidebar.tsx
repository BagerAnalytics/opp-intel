'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { 
  Home, 
  LayoutDashboard, 
  FolderKanban, 
  KanbanSquare, 
  Users, 
  TrendingUp, 
  FileText,
  Settings,
  HelpCircle
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/awards", label: "Awards", icon: TrendingUp },
    { href: "/network", label: "Contacts", icon: Users },
    { href: "/compliance", label: "Compliance Vault", icon: FileText },
  ];

  return (
    <aside className="w-64 h-screen flex flex-col fixed left-0 top-0 z-50 bg-white/70 backdrop-blur-xl border-r border-slate-200/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="h-20 flex items-center px-6 mt-4 mb-2">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="bg-white p-1.5 rounded-xl shadow-sm border border-slate-100">
            <Image src="/logo.png" alt="Premier Agric" width={40} height={40} className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
            OppIntel
          </h1>
        </Link>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-2 mt-2">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href === '/pipeline' && pathname.includes('/pipeline'));
          const Icon = link.icon;
          return (
            <Link 
              key={link.href}
              href={link.href} 
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-[15px] transition-all duration-300 relative group overflow-hidden
                ${isActive 
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100/50 border border-emerald-100/50' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm hover:border-slate-100 border border-transparent'}
              `}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-full" />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={`transition-colors duration-300 ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500'}`} />
              <span className="tracking-wide">{link.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 mb-4 space-y-2">
        <Link href="/settings" className="flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-[15px] text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all duration-300 group border border-transparent hover:border-slate-100">
          <Settings size={20} strokeWidth={2} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
          <span className="tracking-wide">Settings</span>
        </Link>
        <Link href="/help" className="flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-[15px] text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all duration-300 group border border-transparent hover:border-slate-100">
          <HelpCircle size={20} strokeWidth={2} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
          <span className="tracking-wide">Help & Support</span>
        </Link>
      </div>
    </aside>
  );
}
