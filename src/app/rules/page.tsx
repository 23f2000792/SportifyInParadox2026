
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, ShieldCheck, Scale, Info, Zap, CircleDot, Target } from 'lucide-react';

export default function RulesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32">
      <div className="text-center space-y-4 px-4 pt-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Fair Play Guidelines</p>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black uppercase text-foreground leading-none tracking-tighter italic">
          Official Rulebook
        </h1>
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.4em] text-muted-foreground">Paradox 2026 Sports Constitution</p>
      </div>

      <div className="space-y-10 px-4">
        <Card className="premium-card">
          <CardHeader className="bg-muted/5">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" /> General Conduct
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-sm text-muted-foreground leading-relaxed space-y-4">
            <p>1. <strong>Sportsmanship:</strong> All participants must maintain the highest standards of sportsmanship. Taunting, vulgarity, or aggressive behavior toward officials or opponents will lead to immediate disqualification.</p>
            <p>2. <strong>Eligibility:</strong> Only registered IIT Madras BS students with valid ID cards are eligible to represent their houses.</p>
            <p>3. <strong>Timings:</strong> Teams must report at least 15 minutes before the scheduled flag-off/reporting time. A 5-minute grace period is allowed, after which the match will be forfeited (Walkover).</p>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="kampus-run" className="premium-card border-none bg-card">
            <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/5">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-primary/10 rounded-sm flex items-center justify-center border border-primary/20">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black uppercase tracking-tighter">Kampus Run</p>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">3KM & 5KM Athletics</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 py-4 space-y-4 text-sm text-muted-foreground">
              <p>• Participants must wear the official bib at all times during the race.</p>
              <p>• Cutting corners or using any form of transportation will lead to immediate DQ.</p>
              <p>• Checkpoints must be cleared in the specified order to be eligible for ranking.</p>
              <p>• Top 3 finishers in each category earn Championship points for their house.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="football" className="premium-card border-none bg-card">
            <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/5">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-primary/10 rounded-sm flex items-center justify-center border border-primary/20">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black uppercase tracking-tighter">Football</p>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">7-A-Side Tournament</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 py-4 space-y-4 text-sm text-muted-foreground">
              <p>• Standard 7-a-side rules apply. Maximum squad size: 10 players.</p>
              <p>• Matches consist of two 15-minute halves with a 5-minute break.</p>
              <p>• Direct red card leads to a 2-match ban. Two yellows in a match equals a red.</p>
              <p>• Group stage ties lead to a split in points. KO ties go to penalties.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="volleyball" className="premium-card border-none bg-card">
            <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/5">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-primary/10 rounded-sm flex items-center justify-center border border-primary/20">
                  <CircleDot className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black uppercase tracking-tighter">Volleyball</p>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">Court Mastery</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 py-4 space-y-4 text-sm text-muted-foreground">
              <p>• Matches are Best of 3 sets. Final matches are Best of 5 sets.</p>
              <p>• Sets are played to 25 points (win by 2). Final set is played to 15 points.</p>
              <p>• Each team is allowed a maximum of 3 hits to return the ball.</p>
              <p>• Liberos must wear a contrasting jersey.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="badminton" className="premium-card border-none bg-card">
            <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/5">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-primary/10 rounded-sm flex items-center justify-center border border-primary/20">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black uppercase tracking-tighter">Badminton</p>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">House Duals</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 py-4 space-y-4 text-sm text-muted-foreground">
              <p>• Each house dual consists of 4 matches: MS, WS, MD, XD.</p>
              <p>• Matches are Best of 3 sets to 21 points (standard BWF rules).</p>
              <p>• A house wins the tie if they win 3 out of 4 sub-matches.</p>
              <p>• Professional non-marking shoes are mandatory on SAC courts.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex items-center gap-3 p-6 bg-primary/5 rounded-sm border border-primary/10">
          <Info className="h-5 w-5 text-primary shrink-0" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 leading-relaxed">
            Note: The Sports Organizing Committee reserves the right to modify rules or schedules in case of rain or unforeseen logistics.
          </p>
        </div>
      </div>
    </div>
  );
}
