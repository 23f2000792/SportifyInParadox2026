import { EVENTS, MOCK_MATCHES } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Trophy, Zap, CircleDot, Target, Gavel, ArrowRight } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Zap: Zap,
  Trophy: Trophy,
  CircleDot: CircleDot,
  Target: Target,
  Gavel: Gavel,
};

export default function Home() {
  const liveMatches = MOCK_MATCHES.filter(m => m.status === 'Live');
  
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-black md:text-3xl">Sportify 2026</h1>
        <p className="text-sm text-muted-foreground">Central dashboard for Paradox fest sports events.</p>
      </header>

      {/* Live Now Section - Compact */}
      {liveMatches.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-live animate-pulse"></div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-live">Live Now</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {liveMatches.map((match) => (
              <Card key={match.id} className="border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md fast-transition">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">{match.sport}</span>
                    <span className="text-[10px] font-medium text-muted-foreground">{match.time}</span>
                  </div>
                  <div className="grid grid-cols-3 items-center">
                    <div className="text-center">
                      <p className="font-bold text-sm truncate">{match.teamA}</p>
                      <p className="text-2xl font-black">{match.scoreA}</p>
                    </div>
                    <div className="text-center text-[10px] font-black text-muted-foreground/50">VS</div>
                    <div className="text-center">
                      <p className="font-bold text-sm truncate">{match.teamB}</p>
                      <p className="text-2xl font-black">{match.scoreB}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Quick Navigation Cards - Minimalist */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Browse Events</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {EVENTS.map((event) => {
            const IconComp = ICON_MAP[event.icon];
            return (
              <Link key={event.id} href={`/events/${event.slug}`} className="group block">
                <Card className="h-full border-none bg-white shadow-sm hover:ring-1 hover:ring-primary/20 fast-transition">
                  <CardHeader className="p-4 flex flex-col items-center space-y-2">
                    <div className="p-3 rounded-full bg-primary/5 group-hover:bg-primary/10 fast-transition">
                      <IconComp className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xs font-black text-center group-hover:text-primary fast-transition">
                      {event.name}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
