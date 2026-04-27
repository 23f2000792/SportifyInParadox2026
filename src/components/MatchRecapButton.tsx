
"use client";

import { useState, memo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { generateMatchRecap } from '@/ai/flows/ai-match-recap-tool';
import { generateMatchAudio } from '@/ai/flows/ai-match-audio-recap';
import { Match } from '@/lib/types';
import { Sparkles, Loader2, Share2, X, Play, Volume2, Pause } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';

const OFFICIAL_URL = "https://sportify-in-paradox2026.vercel.app/";

export const MatchRecapButton = memo(function MatchRecapButton({ match }: { match: Match }) {
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [recap, setRecap] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [open, setOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (loading) return;
    triggerHaptic('medium');
    setLoading(true);
    setOpen(true);
    try {
      const result = await generateMatchRecap({
        sport: match.sport,
        teamA_name: match.teamA,
        teamA_score: match.scoreA,
        teamB_name: match.teamB,
        teamB_score: match.scoreB,
        keyEvents: match.keyEvents || [],
      });
      setRecap(result.recap);
    } catch (error) {
      setRecap("Recap temporarily unavailable. Please try again soon.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAudio = async () => {
    if (!recap || audioLoading) return;
    triggerHaptic('light');
    
    if (audioUrl) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    setAudioLoading(true);
    try {
      const { audioDataUri } = await generateMatchAudio({ text: recap });
      setAudioUrl(audioDataUri);
      setIsPlaying(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Audio Error",
        description: "Failed to generate radio recap."
      });
    } finally {
      setAudioLoading(false);
    }
  };

  const handleShareRecap = () => {
    if (!recap) return;
    triggerHaptic('success');
    const text = `🎙️ *UNBELIEVABLE AI MATCH RECAP!* 🎙️\n\n"${recap}"\n\nExperience the full thrill, stats, and glory on the Official Sportify Portal! Support your house here:\n🔗 ${OFFICIAL_URL}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 text-[10px] font-black uppercase text-primary hover:text-primary hover:bg-primary/5 gap-1.5 transition-transform active:scale-90"
        onClick={handleGenerate}
      >
        <Sparkles className="h-3 w-3" />
        AI Recap
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-none shadow-2xl bg-card rounded-t-3xl sm:rounded-3xl">
          <div className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
              {(loading || audioLoading) && <div className="h-full bg-primary animate-progress-indefinite" />}
            </div>
            
            <DialogHeader className="p-8 pb-6 bg-gradient-to-br from-primary to-primary/80 text-white">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
                  <Sparkles className="h-5 w-5" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8 rounded-full hover:bg-white/10 text-white">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic leading-none mb-1">
                Sportify Recap
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/70 font-black text-[10px] uppercase tracking-widest">
                {match.teamA} {match.scoreA} - {match.scoreB} {match.teamB}
              </DialogDescription>
            </DialogHeader>

            <div className="p-8 pt-10 space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="relative">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-primary animate-pulse" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-primary/60 animate-pulse tracking-[0.4em]">Drafting Narrative...</p>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="relative">
                    <span className="absolute -top-6 -left-2 text-6xl text-primary/10 font-black italic select-none">"</span>
                    <p className="text-base md:text-lg leading-relaxed font-bold text-foreground italic border-l-4 border-primary pl-5 py-2">
                      {recap}
                    </p>
                    <span className="absolute -bottom-10 -right-2 text-6xl text-primary/10 font-black italic select-none rotate-180">"</span>
                  </div>

                  {recap && !loading && (
                    <div className="mt-8 flex flex-col items-center gap-4">
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="w-full h-16 rounded-2xl gap-3 text-xs font-black uppercase tracking-widest border-primary/20 hover:bg-primary/5 group"
                        onClick={handlePlayAudio}
                        disabled={audioLoading}
                      >
                        {audioLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : isPlaying ? (
                          <Pause className="h-5 w-5 text-primary fill-primary" />
                        ) : (
                          <Volume2 className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                        )}
                        {audioLoading ? "Tuning Radio..." : isPlaying ? "Pause Radio" : "Listen to Radio Recap"}
                      </Button>
                      {audioUrl && (
                        <audio 
                          ref={audioRef} 
                          src={audioUrl} 
                          onEnded={() => setIsPlaying(false)}
                          className="hidden" 
                        />
                      )}
                    </div>
                  )}

                  <div className="mt-12 flex items-center justify-end gap-2 opacity-40">
                    <div className="h-px w-8 bg-muted-foreground" />
                    <p className="text-[9px] font-black uppercase tracking-widest">AI Official Analysis</p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-8 pb-8 flex items-center gap-3">
              <Button 
                onClick={handleShareRecap} 
                disabled={loading}
                className="flex-1 h-14 uppercase font-black text-[11px] tracking-widest gap-3 rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-transform"
              >
                <Share2 className="h-4 w-4" /> Share Narrative
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
