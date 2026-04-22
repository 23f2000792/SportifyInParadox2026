"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, Zap, Trophy, CircleDot, Target, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EVENTS } from '@/lib/mock-data';

const ICON_MAP: Record<string, any> = {
  Zap: Zap,
  Trophy: Trophy,
  CircleDot: CircleDot,
  Target: Target,
};

export function Navbar() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-50 w-full flex flex-col">
      {/* Top Bar: Brand & Admin */}
      <header className="w-full border-b border-white/5 bg-background/80 backdrop-blur-md h-14 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-white text-xs font-black italic shadow-[0_0_15px_rgba(147,51,234,0.5)] group-hover:scale-110 transition-transform">
            S
          </div>
          <span className="text-sm font-black tracking-tighter text-white uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Sportify 2026
          </span>
        </Link>
        
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-live/10 border border-live/20 rounded-full">
            <Radio className="h-3 w-3 text-live animate-pulse" />
            <span className="text-[9px] font-black text-live uppercase tracking-widest">Paradox Live</span>
          </div>
          <Link
            href="/admin"
            className={cn(
              "p-2 rounded-full transition-all hover:bg-white/5",
              pathname === "/admin" ? "text-primary shadow-[0_0_10px_rgba(147,51,234,0.3)]" : "text-muted-foreground"
            )}
            title="Admin Panel"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Event Tabs: Horizontal Scrollable */}
      <nav className="w-full border-b border-white/5 bg-background/40 backdrop-blur-sm overflow-x-auto no-scrollbar scroll-smooth">
        <div className="container mx-auto max-w-5xl flex items-center px-4">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-tight transition-all border-b-2 whitespace-nowrap",
              pathname === "/" 
                ? "text-primary border-primary bg-primary/5" 
                : "text-muted-foreground border-transparent hover:text-white hover:bg-white/5"
            )}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          {EVENTS.map((event) => {
            const IconComp = ICON_MAP[event.icon];
            const isActive = pathname === `/events/${event.slug}`;
            return (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-tight transition-all border-b-2 whitespace-nowrap",
                  isActive 
                    ? "text-primary border-primary bg-primary/5" 
                    : "text-muted-foreground border-transparent hover:text-white hover:bg-white/5"
                )}
              >
                {IconComp && <IconComp className="h-3.5 w-3.5" />}
                {event.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
