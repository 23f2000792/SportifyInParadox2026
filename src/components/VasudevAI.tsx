
'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Bot, X, Trophy, ShieldCheck, Flame, Info, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

// --- Definitive Local Knowledge Engine (Technical Dataset) ---
const TECHNICAL_WISDOM = [
  {
    keywords: ['football', 'pcl', 'penalty', 'penalties', 'one step', 'spike', 'stud', 'time', 'duration', 'half', 'squad', 'player'],
    answer: "Athlete! Here is the technical directive for **Football (PCL)**:\n- **Format**: 7-a-side match structure.\n- **Squad**: Maximum of 9 players per house.\n- **Penalties**: Strictly **ONE-STEP** only. No run-ups allowed.\n- **Footwear**: **STRICTLY NO football spikes or studs**. Only flat soles or turf shoes are allowed on the ground.\n- **Match Duration**: Group Stage (10m halves), Semi-Finals (15m halves), Grand Final (20m halves).\n- **Substitutions**: Rolling substitutions allowed in knockouts only.\n- [View Football Rulebook](https://docs.google.com/document/d/e/2PACX-1vTKj_9bJ4bqYT_q2gD9wyDh24EGUH9s-35t6NaUbr2HjauNprUfFFi2WQgWIAqgXi83dseiCQa16Z9o/pub)"
  },
  {
    keywords: ['badminton', 'pbl', 'shoe', 'footwear', 'marking', 'non-marking', 'ms', 'ws', 'md', 'xd', 'participation'],
    answer: "Warrior! For the **Badminton League (PBL)**, note these clinical laws:\n- **Footwear**: **Non-marking shoes are strictly MANDATORY**. No athlete will be allowed on court without them.\n- **Tie Structure**: MS (Men's Singles), WS (Women's Singles), MD (Men's Doubles), XD (Mixed Doubles).\n- **Participation**: A player can compete in a maximum of **2 sub-matches** in a single tie.\n- **Scoring**: Standard rally scoring. Points vary based on stage (11, 15, or 21).\n- [View Badminton Rulebook](https://docs.google.com/document/d/e/2PACX-1vS-40N_0KX58mXv3x6ojSxjRpcMIWt58iuC6oz7uL-g7gqRetWm172DjMp-JrmVM5yUcOG6Sgxx3yYF/pub)"
  },
  {
    keywords: ['volleyball', 'set', 'point', 'scoring', 'margin', '15', '21', 'rally', 'vibes'],
    answer: "Spiker! For **VolleyVibes (Volleyball)**:\n- **Match Format**: Best of 3 sets.\n- **Scoring**: Sets 1 & 2 are played to 15 points. The deciding set (if needed) is played to 21 points.\n- **Win Margin**: A **2-point lead margin** is mandatory to win a set.\n- **Rotation**: Standard rotation rules apply. Rally scoring in effect.\n- [View Volleyball Rulebook](https://docs.google.com/document/d/e/2PACX-1vQk0Pn79Qd75Qwu2Owaj_HwHWqtGZwwe73w99sQB8bskU4taBvmKBBAI8ZTww_ckf0cgeoJR5VML05g/pub)"
  },
  {
    keywords: ['run', 'kampus', 'race', 'flag', 'reporting', 'time', 'km', '3km', '5km', 'category'],
    answer: "Runner! Technical specs for **Kampus Run**:\n- **Categories**: 3KM Fun Run and 5KM Competitive Run.\n- **Reporting**: You must report **45-60 mins prior** to the flag-off time at the OAT.\n- **Rule**: Runners must stay on the marked track. No outside assistance allowed.\n- **Timing**: Bib-based timing for the 5KM category.\n- [View Kampus Run Rulebook](https://docs.google.com/document/d/e/2PACX-1vSWGI8y2yB9v-df3JQBYlg0r_nGNeNoy0eouE_WfEvxZsrrtbrWXengxOLMv1MX_l96IN5sWIHYIBz0/pub)"
  },
  {
    keywords: ['contact', 'support', 'dispute', 'grievance', 'help', 'email', 'krish', 'aman', 'problem', 'error'],
    answer: "Warrior, for match disputes, registration errors, or technical grievances, contact the **Sportify Core Team**:\n- **Leads**: Krish and Aman\n- **Email**: thesportify.society@study.iitm.ac.in\n- **Portals**: [Helpdesk](https://sportify.iitmbs.org/helpdesk) | [Grievance Portal](https://sportify.iitmbs.org/grievance)"
  }
];

export function VasudevAI() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Namaste, Warrior! I am **Vasudev.ai**, your standalone technical concierge for Paradox 2026. I hold the clinical laws of every rulebook locally. How shall I guide your path to victory today?" 
    }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    
    const userMsg = typeof e === 'string' ? e : input.trim();
    if (!userMsg || loading) return;

    if (typeof e !== 'string') setInput('');
    
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    triggerHaptic('medium');

    // --- Standalone Logic (No AI Network Calls) ---
    setTimeout(() => {
      const q = userMsg.toLowerCase();
      const match = TECHNICAL_WISDOM.find(item => 
        item.keywords.some(keyword => q.includes(keyword))
      );

      let response = "";
      if (match) {
        response = match.answer;
      } else {
        response = "Warrior, that technical path is not in my local records. Please ask about **Football Rules**, **Badminton Gear**, **Volleyball Scoring**, or **Kampus Run timings**. For administrative disputes, reach out to **Krish and Aman**.";
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
      setLoading(false);
      triggerHaptic('success');
    }, 400); 
  };

  const suggestions = [
    { label: "PCL Rules", value: "What are the football rules?", icon: ShieldCheck },
    { label: "Badminton", value: "What shoes are mandatory for badminton?", icon: Trophy },
    { label: "Volleyball", value: "How does volleyball scoring work?", icon: Flame },
    { label: "Support", value: "How do I contact support?", icon: Bot },
  ];

  return (
    <>
      {!open && (
        <Button 
          className="fixed bottom-20 right-4 md:bottom-8 md:right-8 h-16 w-16 rounded-full shadow-[0_0_40px_rgba(124,58,237,0.5)] z-[60] group p-0 bg-primary hover:bg-primary/90 border-2 border-white/20 transition-all hover:scale-110 active:scale-90"
          onClick={() => {
            triggerHaptic('light');
            setOpen(true);
          }}
        >
          <div className="relative h-full w-full flex items-center justify-center">
            <Bot className="h-8 w-8 text-white group-rotate-12 transition-transform" />
            <div className="absolute -top-1 -right-1 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <Sparkles className="relative inline-flex h-5 w-5 text-accent fill-accent" />
            </div>
          </div>
        </Button>
      )}

      {open && (
        <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-[92vw] sm:w-[380px] h-[550px] max-h-[85vh] bg-card/98 backdrop-blur-3xl shadow-2xl rounded-3xl border-t-primary border-t-4 z-[60] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-300">
          
          <div className="p-5 border-b border-border bg-gradient-to-br from-primary/10 via-background to-transparent relative shrink-0">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black italic uppercase tracking-tighter text-primary leading-none">Vasudev.ai</h3>
                <p className="text-[7px] font-black uppercase tracking-[0.3em] opacity-50 mt-1">Local Wisdom Engine</p>
              </div>
            </div>
            <button 
              onClick={() => {
                triggerHaptic('light');
                setOpen(false);
              }}
              className="absolute right-4 top-6 opacity-40 hover:opacity-100 hover:rotate-90 transition-all p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-1.5 p-2 bg-muted/5 border-b border-border/50 overflow-x-auto no-scrollbar scroll-smooth shrink-0">
            {suggestions.map((s, idx) => (
              <Button 
                key={idx} 
                variant="outline" 
                size="sm" 
                className="shrink-0 h-7 text-[7px] font-black uppercase rounded-full gap-1 border-primary/20 bg-background/50 hover:bg-primary/5 transition-all px-3" 
                onClick={() => handleSend(s.value)}
                disabled={loading}
              >
                <s.icon className="h-2.5 w-2.5 text-primary" />
                {s.label}
              </Button>
            ))}
          </div>

          <ScrollArea className="flex-grow p-4">
            <div className="flex flex-col gap-5 max-w-full pb-8">
              {messages.map((m, i) => (
                <div key={i} className={cn(
                  "flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-400",
                  m.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "max-w-[92%] p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm transition-all whitespace-pre-wrap text-justify",
                    m.role === 'user' 
                      ? "bg-primary text-white rounded-tr-none shadow-primary/20 font-bold" 
                      : "bg-muted/40 border border-border/60 rounded-tl-none italic text-foreground shadow-inner"
                  )}>
                    {m.role === 'assistant' ? (
                      <ReactMarkdown 
                        components={{
                          ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-2 mt-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 mb-2 mt-2">{children}</ol>,
                          li: ({ children }) => <li className="text-[13px] leading-snug">{children}</li>,
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-black text-primary uppercase text-[11px]">{children}</strong>,
                          a: ({ href, children }) => (
                            <a 
                              href={href} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-primary font-black underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-all break-all"
                            >
                              {children}
                            </a>
                          )
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    ) : (
                      m.content
                    )}
                  </div>
                  {m.role === 'assistant' && (
                    <span className="text-[6px] font-black uppercase tracking-widest opacity-20 ml-2 mt-1">Vasudev Engine v2.0</span>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-primary py-2 px-3 bg-primary/5 rounded-full w-fit animate-pulse border border-primary/10">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em]">Processing Locally...</span>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-border bg-background/50 backdrop-blur-md shrink-0">
            <form onSubmit={(e) => handleSend(e)} className="flex gap-2">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask technical laws..."
                className="flex-grow h-11 bg-muted/20 border-border/50 rounded-xl font-bold text-xs px-4"
              />
              <Button type="submit" size="icon" className="h-11 w-11 rounded-xl shrink-0 bg-primary hover:bg-primary/90" disabled={loading}>
                <Send className="h-4 w-4 text-white" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
