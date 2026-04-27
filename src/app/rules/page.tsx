'use client';

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Zap, Trophy, CircleDot, Target, ExternalLink, Info } from 'lucide-react';
import { EVENTS } from '@/lib/mock-data';
import { triggerHaptic } from '@/lib/haptics';

export default function RulesPage() {
  const handleOpenRulebook = (url?: string) => {
    if (!url) return;
    triggerHaptic('light');
    window.open(url, '_blank');
  };

  const ICON_MAP: Record<string, any> = {
    Zap: Zap,
    Trophy: Trophy,
    CircleDot: CircleDot,
    Target: Target,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32">
      <div className="text-center space-y-4 px-4 pt-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Official Constitution</p>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black uppercase text-foreground leading-none tracking-tighter italic">
          Tournament Rules
        </h1>
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.4em] text-muted-foreground">Paradox 2026 Sports Directives</p>
      </div>

      <div className="space-y-6 px-4">
        <Accordion type="single" collapsible className="space-y-4">
          {EVENTS.map((event) => {
            const IconComp = ICON_MAP[event.icon] || Target;
            
            return (
              <AccordionItem key={event.id} value={event.slug} className="premium-card border-none bg-card">
                <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/5">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-sm flex items-center justify-center border border-primary/20">
                      <IconComp className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black uppercase tracking-tighter">{event.name}</p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">Official Rulebook v1.0</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 py-6 space-y-4">
                  <div className="p-4 bg-muted/20 rounded-sm border border-border/40 text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">
                    Click the button below to access the full official rulebook for {event.name}. This document includes eligibility, match formats, and conduct guidelines.
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full h-14 text-[10px] font-black uppercase tracking-widest gap-2 rounded-sm border-primary/20 hover:bg-accent hover:text-accent-foreground shadow-lg shadow-primary/5 transition-all duration-200"
                    onClick={() => handleOpenRulebook(event.rulebookUrl)}
                  >
                    <ExternalLink className="h-4 w-4" /> Open Official {event.name} Rulebook
                  </Button>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        <div className="flex items-center gap-3 p-6 bg-primary/5 rounded-sm border border-primary/10">
          <Info className="h-5 w-5 text-primary shrink-0" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 leading-relaxed">
            Note: The Sports Organizing Committee reserves the right to modify rules or schedules in response to rain or logistical contingencies. Please check back regularly for updates.
          </p>
        </div>
      </div>
    </div>
  );
}
