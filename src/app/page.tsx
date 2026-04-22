
'use client';

import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Trophy, Zap, CircleDot, Target, ChevronRight } from 'lucide-react';
import { EVENTS } from '@/lib/mock-data';

const ICON_MAP: Record<string, any> = {
  Zap: Zap,
  Trophy: Trophy,
  CircleDot: CircleDot,
  Target: Target,
};

export default function Home() {
  return (
    <div className="space-y-12 max-w-5xl mx-auto py-10">
      <div className="text-center space-y-4">
        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
          Paradox 2026
        </h1>
        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.6em] text-primary">
          Select Your Transmission Domain
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {EVENTS.map((event) => {
          const IconComp = ICON_MAP[event.icon];
          return (
            <Link key={event.id} href={`/events/${event.slug}`}>
              <Card className="premium-card group h-full overflow-hidden border-white/5 hover:border-primary/50 transition-all duration-500">
                <CardContent className="p-0">
                  <div className="flex h-48">
                    <div className="w-1/3 bg-primary/10 flex items-center justify-center border-r border-white/5 group-hover:bg-primary/20 transition-colors">
                      <IconComp className="h-12 w-12 text-primary" />
                    </div>
                    <div className="w-2/3 p-8 flex flex-col justify-center space-y-2">
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter">{event.name}</h2>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{event.description}</p>
                      <div className="pt-4 flex items-center text-[10px] font-black uppercase text-primary gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        Enter Domain <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
