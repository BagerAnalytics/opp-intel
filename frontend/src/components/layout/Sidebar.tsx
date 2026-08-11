"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { 
  Compass, 
  Target, 
  LineChart, 
  Folder, 
  Globe2,
  Settings,
  HelpCircle,
  MessageSquare,
  ShieldCheck
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard", icon: Compass },
    { href: "/pipeline", label: "Pipeline", icon: LineChart },
    { href: "/network", label: "Network", icon: Target },
    { href: "/compliance", label: "Compliance", icon: ShieldCheck },
    { href: "/geospatial", label: "Geo-Intel", icon: Globe2 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 w-[280px] h-screen glass-panel border-r border-slate-200/50 flex flex-col pt-8 flex-shrink-0 z-50">
      
      {/* Brand Logo */}
      <div className="px-8 mb-12 flex items-center gap-3">
        <div className="w-10 h-10 rounded-[14px] bg-gradient-to-tr from-[#007AFF] to-[#5AC8FA] flex items-center justify-center shadow-sm shadow-[#007AFF]/20">
          <Compass size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-medium tracking-tight text-slate-900 leading-none">OppIntel</h1>
          <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase mt-1">Intelligence</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col pl-4">
        {links.map((link) => {
          const isActive = pathname === link.href;
          
          return (
            <div key={link.href} className="relative group">
              {/* Active Indicator - iOS Style Pill */}
              {isActive && (
                <div className="absolute inset-y-1 right-2 left-2 bg-slate-900 shadow-sm rounded-xl z-0 transition-all duration-400 ease-ios"></div>
              )}
              
              <Link 
                href={link.href} 
                className={`flex items-center gap-4 py-3 px-6 rounded-xl font-medium text-[15px] transition-all duration-400 ease-ios relative z-10 m-1 mx-2
                  ${isActive 
                    ? 'text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 hover:scale-[1.02]'}
                `}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={`transition-colors duration-400 ease-ios ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`} linkIcon={link.icon} />
                <span className="tracking-tight">{link.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>
      
      {/* Bottom Profile / Branding */}
      <div className="p-8 mt-auto flex flex-col gap-6">
        <div className="w-full h-[1px] bg-slate-200/50"></div>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-slate-400 tracking-widest uppercase">OppIntel Admin</p>
          <p className="text-[10px] text-slate-400 tracking-wider">© 2026 All Rights Reserved</p>
        </div>
      </div>
    </aside>
  );
}

function Icon({ linkIcon: LinkIcon, ...props }: any) {
  return <LinkIcon {...props} />;
}
