'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Loader2 } from 'lucide-react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthPage = pathname === '/login';

  useEffect(() => {
    const token = localStorage.getItem('oppintel_token');
    if (!token && !isAuthPage) {
      router.push('/login');
    } else if (token && isAuthPage) {
      router.push('/');
    } else {
      setIsAuthenticated(!!token || isAuthPage);
      setIsLoading(false);
    }
  }, [pathname, router, isAuthPage]);

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400 w-8 h-8" />
      </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 ml-[280px] flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-8 relative z-0">
          {children}
        </main>
      </div>
    </>
  );
}
