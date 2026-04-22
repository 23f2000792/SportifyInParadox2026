"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, Zap, Trophy, CircleDot, Target, Radio, Home } from 'lucide-react';
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
    <>
      {/* Universal Top Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md h-14 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white text-[11px] font-black italic shadow-[0_0_15px_rgba(147,51,234,0.4)] group-hover:scale-110 transition-transform">
            S
          </div>
          <span className="text-sm font-black tracking-tighter text-white uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Sportify 2026
          </span>
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-full">
            <Radio className="h-3 w-3 text-primary animate-pulse" />
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Live</span>
          </div>
          <Link
            href="/admin"
            className={cn(
              "p-2 rounded-xl transition-all hover:bg-white/5",
              pathname.startsWith("/admin") ? "text-primary bg-primary/5" : "text-muted-foreground"
            )}
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* Desktop Top Navigation (Horizontal) */}
      <nav className="hidden md:flex w-full border-b border-white/5 bg-background/40 backdrop-blur-sm overflow-x-auto no-scrollbar">
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
            <LayoutDashboard className="h-4 w-4" />
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
                {IconComp && <IconComp className="h-4 w-4" />}
                {event.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/90 backdrop-blur-xl border-t border-white/5 h-16 flex items-center justify-around px-2 pb-safe">
        <Link href="/" className={cn("flex flex-col items-center gap-1 px-3", pathname === "/" ? "text-primary" : "text-muted-foreground")}>
          <Home className="h-5 w-5" />
          <span className="text-[8px] font-black uppercase">Home</span>
        </Link>
        {EVENTS.map((event) => {
          const IconComp = ICON_MAP[event.icon];
          const isActive = pathname === `/events/${event.slug}`;
          return (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className={cn("flex flex-col items-center gap-1 px-3", isActive ? "text-primary" : "text-muted-foreground")}
            >
              {IconComp && <IconComp className="h-5 w-5" />}
              <span className="text-[8px] font-black uppercase">{event.name.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
