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
      <header className="w-full border-b border-white/5 bg-background/80 backdrop-blur-md h-12 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white text-[10px] font-black italic shadow-[0_0_10px_rgba(147,51,234,0.4)] group-hover:scale-110 transition-transform">
            S
          </div>
          <span className="text-xs font-black tracking-tighter text-white uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Sportify 2026
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-0.5 bg-primary/10 border border-primary/20 rounded-full">
            <Radio className="h-2.5 w-2.5 text-primary animate-pulse" />
            <span className="text-[8px] font-black text-primary uppercase tracking-widest">Live Now</span>
          </div>
          <Link
            href="/admin"
            className={cn(
              "p-1.5 rounded-full transition-all hover:bg-white/5",
              pathname.startsWith("/admin") ? "text-primary bg-primary/5" : "text-muted-foreground"
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
              "flex items-center gap-2 px-5 py-3.5 text-[9px] font-black uppercase tracking-tight transition-all border-b-2 whitespace-nowrap",
              pathname === "/" 
                ? "text-primary border-primary bg-primary/5" 
                : "text-muted-foreground border-transparent hover:text-white hover:bg-white/5"
            )}
          >
            <LayoutDashboard className="h-3 w-3" />
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
                  "flex items-center gap-2 px-5 py-3.5 text-[9px] font-black uppercase tracking-tight transition-all border-b-2 whitespace-nowrap",
                  isActive 
                    ? "text-primary border-primary bg-primary/5" 
                    : "text-muted-foreground border-transparent hover:text-white hover:bg-white/5"
                )}
              >
                {IconComp && <IconComp className="h-3 w-3" />}
                {event.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
