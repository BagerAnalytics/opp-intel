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
    <aside className="w-64 h-screen flex flex-col fixed left-0 top-0 z-50 bg-white border-r border-slate-200 shadow-sm">
      <div className="h-20 flex items-center px-6 mt-4 mb-2">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Premier Agric" width={48} height={48} className="object-contain" />
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            OppIntel
          </h1>
        </Link>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1 mt-2">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href === '/pipeline' && pathname.includes('/pipeline'));
          const Icon = link.icon;
          return (
            <Link 
              key={link.href}
              href={link.href} 
              className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200
                ${isActive 
                  ? 'bg-emerald-50 text-emerald-700 font-semibold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
              `}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 mb-4 space-y-1">
        <Link href="/settings" className="flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all">
          <Settings size={18} strokeWidth={2} className="text-slate-400" />
          Settings
        </Link>
        <Link href="/help" className="flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all">
          <HelpCircle size={18} strokeWidth={2} className="text-slate-400" />
          Help
        </Link>
      </div>
    </aside>
  );
}
