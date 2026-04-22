"use client";

import Link from 'next/link';
import { LayoutDashboard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-sm h-14">
      <div className="container mx-auto flex h-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-white text-sm font-black italic">
            P
          </div>
          <span className="text-lg font-black tracking-tighter text-primary uppercase">
            SportFlow
          </span>
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-1.5 text-xs font-black uppercase tracking-tight transition-colors hover:text-primary",
              pathname === "/" ? "text-primary" : "text-muted-foreground"
            )}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Dashboard</span>
          </Link>
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-1.5 text-xs font-black uppercase tracking-tight transition-colors hover:text-primary",
              pathname === "/admin" ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Admin</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
