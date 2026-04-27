
export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-[0_0_20px_rgba(147,51,234,0.3)]"></div>
        <div className="absolute h-8 w-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin-slow"></div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">Initializing Streams</p>
        <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">Sportify Paradox 2026 Core</p>
      </div>
    </div>
  );
}
