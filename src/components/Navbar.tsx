'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, Zap, Trophy, CircleDot, Target, Radio, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EVENTS } from '@/lib/mock-data';

const LOGO_URL = "https://ik.imagekit.io/qaugsnc1c/sportify_logo1.png?updatedAt=1762330168970";

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
      {/* Universal Top Bar - Minimalist */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.05] bg-background/80 backdrop-blur-xl h-16 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-white/[0.03] border border-white/[0.05] p-1.5 transition-all group-hover:border-primary/20">
            <Image 
              src={LOGO_URL}
              alt="Sportify Logo"
              fill
              className="object-contain p-1.5"
              priority
            />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-black tracking-tighter text-white uppercase leading-none">SPORTIFY</p>
            <p className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em] mt-1">Paradox 2026</p>
          </div>
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="hidden xs:flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] border border-white/[0.05] rounded-full">
            <Radio className="h-3 w-3 text-primary" />
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">Broadcast Active</span>
          </div>
          <Link
            href="/admin"
            className={cn(
              "h-10 w-10 flex items-center justify-center rounded-xl transition-all border border-transparent",
              pathname.startsWith("/admin") 
                ? "text-primary bg-primary/10 border-primary/20" 
                : "text-muted-foreground hover:bg-white/[0.03] hover:text-white"
            )}
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* Desktop Navigation - Hidden on mobile */}
      <nav className="hidden md:flex w-full border-b border-white/[0.03] bg-background/40 backdrop-blur-sm">
        <div className="container mx-auto max-w-5xl flex items-center px-4">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 px-8 py-5 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap",
              pathname === "/" 
                ? "text-primary border-primary bg-primary/[0.02]" 
                : "text-muted-foreground/40 border-transparent hover:text-white hover:bg-white/[0.01]"
            )}
          >
            Dashboard
          </Link>
          {EVENTS.map((event) => {
            const isActive = pathname === `/events/${event.slug}`;
            return (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className={cn(
                  "flex items-center gap-2 px-8 py-5 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap",
                  isActive 
                    ? "text-primary border-primary bg-primary/[0.02]" 
                    : "text-muted-foreground/40 border-transparent hover:text-white hover:bg-white/[0.01]"
                )}
              >
                {event.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation - Highly Minimalist */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-2xl border-t border-white/[0.05] h-20 flex items-center justify-around px-4 pb-safe">
        <Link href="/" className={cn("flex flex-col items-center gap-1.5 transition-all", pathname === "/" ? "text-primary scale-110" : "text-muted-foreground/30")}>
          <Home className="h-5 w-5" />
          <span className="text-[7px] font-black uppercase tracking-widest">Home</span>
        </Link>
        {EVENTS.map((event) => {
          const IconComp = ICON_MAP[event.icon];
          const isActive = pathname === `/events/${event.slug}`;
          return (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className={cn("flex flex-col items-center gap-1.5 transition-all", isActive ? "text-primary scale-110" : "text-muted-foreground/30")}
            >
              {IconComp && <IconComp className="h-5 w-5" />}
              <span className="text-[7px] font-black uppercase tracking-widest">{event.name.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
