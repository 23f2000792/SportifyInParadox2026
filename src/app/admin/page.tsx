"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EVENTS, MOCK_MATCHES } from '@/lib/mock-data';
import { PlusCircle, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const { toast } = useToast();
  const [selectedSport, setSelectedSport] = useState<string>('football');

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Success",
      description: "Match data has been updated in Firestore.",
    });
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl">Admin Control Panel</h1>
        <p className="text-muted-foreground">Manage scores, schedules, and standings for Sportify 2026.</p>
      </div>

      <Tabs defaultValue="scores" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scores">Update Scores</TabsTrigger>
          <TabsTrigger value="schedule">Manage Schedule</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
        </TabsList>

        <TabsContent value="scores" className="space-y-6 pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Score Update</CardTitle>
              <CardDescription>Update scores for ongoing or recently completed matches.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleUpdate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Event</Label>
                    <Select value={selectedSport} onValueChange={setSelectedSport}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sport" />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENTS.map(e => (
                          <SelectItem key={e.id} value={e.slug}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Select Match</Label>
                    <Select defaultValue={MOCK_MATCHES[0].id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Matchup" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_MATCHES.filter(m => m.sport === selectedSport).map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.teamA} vs {m.teamB}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 items-end border p-4 rounded-lg bg-muted/20">
                  <div className="space-y-2 text-center">
                    <Label className="block mb-1">Team A Score</Label>
                    <Input type="number" defaultValue="0" className="text-center text-xl font-black h-12" />
                  </div>
                  <div className="space-y-2 text-center">
                    <Label className="block mb-1">Team B Score</Label>
                    <Input type="number" defaultValue="0" className="text-center text-xl font-black h-12" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select defaultValue="Live">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Upcoming">Upcoming</SelectItem>
                      <SelectItem value="Live">Live</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="flex-1 gap-2">
                    <Save className="h-4 w-4" /> Save Changes
                  </Button>
                  <Button type="button" variant="outline" className="gap-2">
                    <RotateCcw className="h-4 w-4" /> Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4 pt-6 text-center py-12">
            <PlusCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-bold">Manage Match Schedule</h3>
            <p className="text-muted-foreground">This feature allows adding new matches to the calendar.</p>
            <Button className="mt-4">Add New Match</Button>
        </TabsContent>

        <TabsContent value="standings" className="space-y-4 pt-6 text-center py-12">
            <h3 className="text-lg font-bold">Auto-Recalculate Standings</h3>
            <p className="text-muted-foreground">Standings are automatically calculated based on completed match scores.</p>
            <Button variant="outline" className="mt-4">Force Refresh Standings</Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
