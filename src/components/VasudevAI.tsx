
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, Send, Loader2, Bot, X, MessageSquare, Trophy, Calendar, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { vasudevAssistant } from '@/ai/flows/vasudev-ai-flow';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import { Match, Standing } from '@/lib/types';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export function VasudevAI() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Namaste! I am Vasudev.ai, your official Paradox 2026 concierge. I have the rulebooks memorized and the live scores at my fingertips. How can I help you achieve greatness today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const db = useFirestore();

  // Fetch real-time context to feed into the AI
  const matchesQuery = useMemo(() => query(collection(db, 'matches'), orderBy('updatedAt', 'desc'), limit(10)), [db]);
  const standingsQuery = useMemo(() => query(collection(db, 'standings'), limit(20)), [db]);

  const { data: recentMatches } = useCollection<Match>(matchesQuery);
  const { data: standings } = useCollection<Standing>(standingsQuery);

  const appStateContext = useMemo(() => {
    let ctx = "REAL-TIME TOURNAMENT DATA:\n";
    
    if (recentMatches && recentMatches.length > 0) {
      ctx += "\nRECENT/LIVE MATCHES:\n";
      recentMatches.forEach(m => {
        ctx += `- ${m.sport.toUpperCase()}: ${m.teamA} ${m.scoreA} - ${m.scoreB} ${m.teamB} (${m.status}, ${m.phase})\n`;
      });
    }

    if (standings && standings.length > 0) {
      ctx += "\nSTANDINGS SUMMARY:\n";
      standings.slice(0, 10).forEach(s => {
        ctx += `- ${s.team} (${s.sport}): ${s.points} pts, Played: ${s.played}, Won: ${s.won}\n`;
      });
    }

    return ctx;
  }, [recentMatches, standings]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    triggerHaptic('medium');

    try {
      const result = await vasudevAssistant({ 
        query: userMsg,
        context: appStateContext
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: result.answer }]);
      triggerHaptic('success');
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: "Forgive me, the signal is fluctuating. Please try your question again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          className="fixed bottom-20 right-4 md:bottom-8 md:right-8 h-14 w-14 rounded-full shadow-[0_0_30px_rgba(124,58,237,0.4)] z-[45] group p-0 bg-primary hover:bg-primary/90 border-2 border-white/20"
          onClick={() => triggerHaptic('light')}
        >
          <div className="relative h-full w-full flex items-center justify-center">
            <Bot className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
            <div className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <Sparkles className="relative inline-flex h-4 w-4 text-accent fill-accent" />
            </div>
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] sm:h-[650px] p-0 border-t-primary border-t-4 rounded-t-[2.5rem] bg-background/98 backdrop-blur-2xl shadow-2xl">
        <SheetHeader className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent relative rounded-t-[2.5rem]">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Bot className="h-7 w-7 text-white" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-black italic uppercase tracking-tighter text-primary">Vasudev.ai</SheetTitle>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Official Tournament Intelligence</p>
            </div>
          </div>
          <SheetClose className="absolute right-6 top-8 opacity-40 hover:opacity-100 transition-opacity">
            <X className="h-6 w-6" />
          </SheetClose>
        </SheetHeader>

        <div className="flex flex-col h-[calc(85vh-120px)] sm:h-[530px]">
          <div className="flex gap-2 p-3 bg-muted/10 border-b border-border overflow-x-auto no-scrollbar">
            <Button variant="outline" size="sm" className="shrink-0 h-7 text-[8px] font-black uppercase rounded-full gap-1 border-primary/20" onClick={() => setInput("What are the football penalty rules?")}>
              <Trophy className="h-3 w-3" /> PCL Rules
            </Button>
            <Button variant="outline" size="sm" className="shrink-0 h-7 text-[8px] font-black uppercase rounded-full gap-1 border-primary/20" onClick={() => setInput("Who is leading the championship?")}>
              <Trophy className="h-3 w-3" /> Standings
            </Button>
            <Button variant="outline" size="sm" className="shrink-0 h-7 text-[8px] font-black uppercase rounded-full gap-1 border-primary/20" onClick={() => setInput("What time is Kampus Run flag-off?")}>
              <Calendar className="h-3 w-3" /> Race Info
            </Button>
          </div>

          <ScrollArea className="flex-grow px-6 py-4">
            <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-10">
              {messages.map((m, i) => (
                <div key={i} className={cn(
                  "flex flex-col",
                  m.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "max-w-[85%] md:max-w-[80%] p-4 rounded-[1.5rem] text-[13px] font-bold leading-relaxed shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2",
                    m.role === 'user' 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-muted/50 border border-border/50 rounded-tl-none italic text-foreground"
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-3 text-primary py-2 px-4 bg-primary/5 rounded-full w-fit animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Consulting Rulebooks...</span>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-6 border-t border-border bg-background mb-safe">
            <form onSubmit={handleSend} className="max-w-2xl mx-auto flex gap-3">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about rules, scores, or schedules..."
                className="flex-grow h-14 bg-muted/20 border-none rounded-2xl font-bold text-sm px-6 focus-visible:ring-2 focus-visible:ring-primary/20"
              />
              <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl shrink-0 shadow-xl shadow-primary/20 transition-transform active:scale-90" disabled={loading}>
                <Send className="h-6 w-6" />
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
