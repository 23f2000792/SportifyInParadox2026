"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EVENTS, MOCK_MATCHES } from '@/lib/mock-data';
import { Save, RotateCcw, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const { toast } = useToast();
  const [selectedSport, setSelectedSport] = useState<string>('football');

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Updated",
      description: "Match results have been synchronized.",
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black">Admin Panel</h1>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Sportify 2026 Management</p>
      </div>

      <Tabs defaultValue="scores" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 h-10 p-1">
          <TabsTrigger value="scores" className="text-[10px] font-black uppercase">Update Scores</TabsTrigger>
          <TabsTrigger value="schedule" className="text-[10px] font-black uppercase">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="scores" className="space-y-4 pt-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-sm font-black uppercase">Quick Update</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-4">
              <form className="space-y-4" onSubmit={handleUpdate}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase">Event</Label>
                    <Select value={selectedSport} onValueChange={setSelectedSport}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENTS.map(e => (
                          <SelectItem key={e.id} value={e.slug}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase">Match</Label>
                    <Select defaultValue={MOCK_MATCHES[0].id}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_MATCHES.filter(m => m.sport === selectedSport).map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.teamA} v {m.teamB}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 bg-muted/30 p-4 rounded-lg">
                  <div className="text-center flex-1">
                    <Label className="text-[9px] font-black uppercase block mb-2">Team A</Label>
                    <Input type="number" defaultValue="0" className="text-center text-2xl font-black h-12 w-full" />
                  </div>
                  <div className="text-lg font-black text-muted-foreground/30">-</div>
                  <div className="text-center flex-1">
                    <Label className="text-[9px] font-black uppercase block mb-2">Team B</Label>
                    <Input type="number" defaultValue="0" className="text-center text-2xl font-black h-12 w-full" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase">Match Status</Label>
                  <Select defaultValue="Live">
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Upcoming">Upcoming</SelectItem>
                      <SelectItem value="Live">Live</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1 h-10 text-xs font-black uppercase gap-2">
                    <Save className="h-4 w-4" /> Save Score
                  </Button>
                  <Button type="button" variant="outline" className="h-10 text-xs font-black uppercase gap-2">
                    <RotateCcw className="h-4 w-4" /> Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="pt-4">
          <Card className="border-none shadow-sm flex flex-col items-center justify-center p-12 text-center space-y-3">
            <Plus className="h-8 w-8 text-muted-foreground/20" />
            <h3 className="text-sm font-black uppercase">Add New Match</h3>
            <p className="text-xs text-muted-foreground">Define team pairings and scheduled timings.</p>
            <Button className="mt-2 text-xs font-black uppercase">New Entry</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
