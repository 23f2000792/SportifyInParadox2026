"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, Zap, Trophy, CircleDot, Target, Gavel, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EVENTS } from '@/lib/mock-data';

const ICON_MAP: Record<string, any> = {
  Zap: Zap,
  Trophy: Trophy,
  CircleDot: CircleDot,
  Target: Target,
  Gavel: Gavel,
};

export function Navbar() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-50 w-full flex flex-col">
      {/* Top Bar: Brand & Admin */}
      <header className="w-full border-b bg-white h-12 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white text-[10px] font-black italic">
            P
          </div>
          <span className="text-sm font-black tracking-tighter text-primary uppercase">
            SportFlow
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-live/10 rounded-full">
            <Radio className="h-3 w-3 text-live animate-pulse" />
            <span className="text-[9px] font-black text-live uppercase tracking-wider">Paradox Live</span>
          </div>
          <Link
            href="/admin"
            className={cn(
              "p-2 rounded-full transition-colors hover:bg-muted",
              pathname === "/admin" ? "text-primary" : "text-muted-foreground"
            )}
            title="Admin Panel"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Event Tabs: Horizontal Scrollable */}
      <nav className="w-full border-b bg-white/95 backdrop-blur-sm overflow-x-auto no-scrollbar scroll-smooth shadow-sm">
        <div className="container mx-auto max-w-5xl flex items-center px-2">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-tight transition-all border-b-2 whitespace-nowrap",
              pathname === "/" 
                ? "text-primary border-primary bg-primary/5" 
                : "text-muted-foreground border-transparent hover:text-primary"
            )}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Home
          </Link>
          {EVENTS.map((event) => {
            const IconComp = ICON_MAP[event.icon];
            const isActive = pathname === `/events/${event.slug}`;
            return (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-tight transition-all border-b-2 whitespace-nowrap",
                  isActive 
                    ? "text-primary border-primary bg-primary/5" 
                    : "text-muted-foreground border-transparent hover:text-primary"
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
