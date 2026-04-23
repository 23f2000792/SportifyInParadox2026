
"use client";

import { useState, memo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { generateMatchRecap, generateAudioCommentary } from '@/ai/flows/ai-match-recap-tool';
import { Match } from '@/lib/types';
import { Sparkles, Loader2, Play, Pause, Volume2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export const MatchRecapButton = memo(function MatchRecapButton({ match }: { match: Match }) {
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [recap, setRecap] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [open, setOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleGenerate = async () => {
    if (loading) return;
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
      
      // Auto-generate audio after recap is ready
      setAudioLoading(true);
      const audioResult = await generateAudioCommentary(result.recap);
      setAudioUrl(audioResult.audioData);
    } catch (error) {
      setRecap("Recap temporarily unavailable. Please try again soon.");
    } finally {
      setLoading(false);
      setAudioLoading(false);
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 text-[10px] font-black uppercase text-primary hover:text-primary hover:bg-primary/5 gap-1.5"
        onClick={handleGenerate}
      >
        <Sparkles className="h-3 w-3" />
        AI Recap
      </Button>

      <Dialog open={open} onOpenChange={(val) => {
        setOpen(val);
        if (!val && audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl bg-card">
          <DialogHeader className="p-6 bg-primary text-white">
            <DialogTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tight italic">
              <Sparkles className="h-5 w-5" />
              Paradox Broadcast
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 font-black text-[10px] uppercase tracking-widest">
              {match.teamA} {match.scoreA} - {match.scoreB} {match.teamB}
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase text-muted-foreground animate-pulse tracking-[0.3em]">Drafting Narrative...</p>
              </div>
            ) : (
              <>
                <div className="relative">
                  <p className="text-sm md:text-base leading-relaxed font-bold text-foreground italic border-l-4 border-primary/40 pl-5 py-2">
                    "{recap}"
                  </p>
                </div>

                {audioUrl && (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Volume2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-white">Audio Commentary</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">AI Narrator: Algenib</p>
                      </div>
                    </div>
                    <Button 
                      size="icon" 
                      onClick={toggleAudio} 
                      className="h-12 w-12 rounded-full shadow-xl shadow-primary/20"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </Button>
                    <audio 
                      ref={audioRef} 
                      src={audioUrl} 
                      onEnded={() => setIsPlaying(false)}
                      className="hidden" 
                    />
                  </div>
                )}

                {audioLoading && !audioUrl && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Synthesizing Voice...</p>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="px-6 pb-6 flex justify-end">
            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase h-9 px-6 hover:bg-white/5" onClick={() => setOpen(false)}>Dismiss</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
