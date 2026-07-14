'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Trello, Network, ShieldCheck } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pipeline", label: "Pipeline", icon: Trello },
    { href: "/network", label: "Contact Network", icon: Network },
    { href: "/compliance", label: "Compliance Data", icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 glass-panel h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Opp<span className="text-gray-500">Intel</span>
        </h1>
      </div>
      <nav className="flex-1 px-3 py-6 space-y-1.5">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.href}
              href={link.href} 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                ${isActive 
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[inset_0_0_12px_rgba(99,102,241,0.1)]' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'}
              `}
            >
              <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-gray-500'} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-xs shadow-[0_0_10px_rgba(99,102,241,0.4)]">
            PA
          </div>
          <div className="text-sm">
            <p className="font-medium text-white">Premier Agric</p>
            <p className="text-gray-500 text-xs">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
