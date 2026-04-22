import { EVENTS, MOCK_MATCHES } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Trophy, Zap, CircleDot, Target, Gavel, ChevronRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ICON_MAP: Record<string, any> = {
  Zap: Zap,
  Trophy: Trophy,
  CircleDot: CircleDot,
  Target: Target,
  Gavel: Gavel,
};

export default function Home() {
  const liveMatches = MOCK_MATCHES.filter(m => m.status === 'Live');
  const upcomingMatches = MOCK_MATCHES.filter(m => m.status === 'Upcoming').slice(0, 5);
  const completedMatches = MOCK_MATCHES.filter(m => m.status === 'Completed')
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 5);
  
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Live Now Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-live"></span>
          </span>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-live">Live Now</h2>
        </div>
        
        {liveMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {liveMatches.map((match) => (
              <Card key={match.id} className="border-none shadow-sm ring-1 ring-live/20 bg-white overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <Badge className="bg-live/10 text-live text-[9px] font-black border-none px-2 uppercase">
                      {match.sport}
                    </Badge>
                    <span className="text-[9px] font-black text-live animate-pulse">🔴 LIVE</span>
                  </div>
                  <div className="flex items-center justify-between gap-6 px-2">
                    <div className="flex flex-col items-center flex-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Home</p>
                      <p className="text-sm font-black text-center truncate w-full">{match.teamA}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-3xl font-black tabular-nums tracking-tighter">
                        {match.scoreA}<span className="text-muted-foreground/30 mx-1">:</span>{match.scoreB}
                      </div>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Away</p>
                      <p className="text-sm font-black text-center truncate w-full">{match.teamB}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-muted/30 rounded-lg p-6 text-center border border-dashed">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">No active matches at the moment</p>
          </div>
        )}
      </section>

      {/* 2. Quick Access Cards */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {EVENTS.map((event) => {
            const IconComp = ICON_MAP[event.icon];
            return (
              <Link key={event.id} href={`/events/${event.slug}`}>
                <Card className="border-none shadow-sm hover:ring-2 hover:ring-primary/20 transition-all aspect-square flex flex-col items-center justify-center gap-2 p-2">
                  <div className="p-2 rounded-full bg-primary/5">
                    <IconComp className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-black uppercase text-center leading-tight">
                    {event.name}
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 3. Today's Schedule */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Today's Schedule</h2>
            <Clock className="h-4 w-4 text-muted-foreground/40" />
          </div>
          <Card className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-0 divide-y divide-muted/50">
              {upcomingMatches.length > 0 ? (
                upcomingMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-3 hover:bg-muted/20 transition-colors">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-primary uppercase">{match.time}</span>
                        <span className="text-[9px] font-black text-muted-foreground uppercase bg-muted/50 px-1.5 rounded">{match.sport}</span>
                      </div>
                      <p className="text-sm font-bold mt-0.5">{match.teamA} v {match.teamB}</p>
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black uppercase border-muted-foreground/20 text-muted-foreground">Upcoming</Badge>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-[10px] text-muted-foreground uppercase">No upcoming matches</div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* 4. Latest Results */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Latest Results</h2>
            <Trophy className="h-4 w-4 text-muted-foreground/40" />
          </div>
          <div className="space-y-2">
            {completedMatches.map((match) => (
              <Card key={match.id} className="border-none shadow-sm overflow-hidden bg-white hover:bg-muted/5 transition-colors">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-muted-foreground uppercase">{match.sport}</span>
                      <span className="text-[9px] font-medium text-muted-foreground/50">{match.time}</span>
                    </div>
                    <p className="text-xs font-bold mt-0.5">
                      <span className={match.scoreA > match.scoreB ? 'text-win' : ''}>{match.teamA}</span>
                      <span className="mx-1 text-muted-foreground">v</span>
                      <span className={match.scoreB > match.scoreA ? 'text-win' : ''}>{match.teamB}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-black tabular-nums bg-muted/30 px-2 py-1 rounded">
                      {match.scoreA}-{match.scoreB}
                    </div>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
