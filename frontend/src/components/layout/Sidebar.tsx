'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
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
    <aside className="w-64 h-screen flex flex-col fixed left-0 top-0 z-50 bg-[#1e2029]/40 backdrop-blur-3xl border-r border-white/5 shadow-2xl">
      <div className="h-20 flex items-center px-6 mt-2">
        <div className="flex items-center gap-3">
          {/* Faux Logo mimicking the AETHEL icon */}
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute w-5 h-5 bg-cyan-400 rounded-sm transform rotate-45 -translate-x-1 mix-blend-screen opacity-90"></div>
            <div className="absolute w-5 h-5 bg-blue-600 rounded-sm transform rotate-45 translate-x-1 mix-blend-screen opacity-90"></div>
          </div>
          <h1 className="text-xl font-bold tracking-widest text-white mt-1 uppercase">
            OppIntel
          </h1>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-2 mt-4">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href === '/pipeline' && pathname.includes('/pipeline'));
          const Icon = link.icon;
          return (
            <Link 
              key={link.href}
              href={link.href} 
              className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                ${isActive 
                  ? 'bg-[#4352ff] text-white shadow-lg shadow-blue-500/20' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}
              `}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white' : 'text-gray-400'} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 mb-4 space-y-2">
        <Link href="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-sm text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-all">
          <Settings size={18} strokeWidth={2} />
          Settings
        </Link>
        <Link href="/help" className="flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-sm text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-all">
          <HelpCircle size={18} strokeWidth={2} />
          Help
        </Link>
      </div>
    </aside>
  );
}
