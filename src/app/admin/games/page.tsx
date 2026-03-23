'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Gamepad2, 
  Loader2, 
  Settings2, 
  Database,
  Plus,
  Trash2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function GamesManager() {
  const [games, setGames] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newGame, setNewGame] = useState({
    id: '',
    name: '',
    game_type: 'raffle',
    total_tickets: 100,
    ticket_price: 1,
    auto_play_hours: 24,
    next_winner_minutes: 10,
    is_bot_play: false,
    winners_count: 1,
    prizes: [{ rank: 1, percentage: 100 }],
    instructions: '',
    photo_url: '',
    draw_date: ''
  });

  const fetchGames = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/games', { cache: 'no-store' });
      const data = await res.json();
      
      if (res.ok) {
        // Filter out roulette & crash as requested by Admin
        const filteredGames = (data.games || []).filter((g: any) => {
          const title = (g.name || '').toLowerCase();
          const sid = (g.id || '').toLowerCase();
          return !(title.includes('roulette') || sid === 'roulette' || title.includes('crash') || sid.includes('crash'));
        });
        setGames(filteredGames);
      }
    } catch (err) {
      console.error('Fetch Games Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const payload = {
        ...newGame,
        draw_date: newGame.draw_date ? new Date(newGame.draw_date).toISOString() : null
      };

      const res = await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast({ title: 'Game Installed', description: 'New engine loaded to MongoDB.' });
      setIsDialogOpen(false);
      fetchGames(); // reload games list to show new game
      setNewGame({ 
        id: '', 
        name: '', 
        game_type: 'raffle', 
        total_tickets: 100, 
        ticket_price: 1, 
        auto_play_hours: 24, 
        next_winner_minutes: 10, 
        is_bot_play: false, 
        winners_count: 1, 
        prizes: [{ rank: 1, percentage: 100 }],
        instructions: '',
        photo_url: '',
        draw_date: ''
      });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Installation Failed', description: err.message });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (gameId: string, gameName: string) => {
    if (!window.confirm(`ALERT: Are you absolutely sure you want to PERMANENTLY wipe the engine [ ${gameName.toUpperCase()} ] and its configurations from MongoDB? This action is irreversible.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/games/${gameId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      toast({ title: 'Engine Erased', description: `${gameName} has been wiped from the database.` });
      fetchGames(); // Automatically resync the UI
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Purge Failed', description: err.message });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Accessing Game Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-tight">GAME <span className="text-primary">MANAGER</span></h1>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest mt-1 flex items-center gap-2">
            <Database className="w-3 h-3 text-accent" />
            Live Platform Engine Configuration (MongoDB)
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="font-black italic shadow-[0_0_20px_rgba(91,87,233,0.3)] h-11 px-8 uppercase tracking-widest text-[10px]">
              <Plus className="w-4 h-4 mr-2" />
              CREATE NEW GAME
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0b0e1b] border-white/10 text-white backdrop-blur-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-primary">INITIALIZE ENGINE</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateGame} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Engine Name</Label>
                  <Input required placeholder="System Name" value={newGame.name} onChange={e => setNewGame({...newGame, name: e.target.value})} className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label>Architecture Type</Label>
                  <Select value={newGame.game_type} onValueChange={(val) => setNewGame({...newGame, game_type: val})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white font-bold h-10 w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10 backdrop-blur-2xl">
                      <SelectItem value="raffle">Raffle Draw</SelectItem>
                      <SelectItem value="slot_raffle">Slot-Style Raffle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Unique ID (Slug)</Label>
                <Input required placeholder="game-slug" value={newGame.id} onChange={e => setNewGame({...newGame, id: e.target.value})} className="bg-white/5 border-white/10" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Tickets</Label>
                  <Input type="number" required value={newGame.total_tickets} onChange={e => setNewGame({...newGame, total_tickets: Number(e.target.value)})} className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label>Ticket Price ($)</Label>
                  <Input type="number" step="0.01" required value={newGame.ticket_price} onChange={e => setNewGame({...newGame, ticket_price: Number(e.target.value)})} className="bg-white/5 border-white/10" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#facc15] font-black uppercase text-[10px]">Play Date & Time (Selected Time)</Label>
                  <Input type="datetime-local" value={newGame.draw_date || ''} onChange={e => setNewGame({...newGame, draw_date: e.target.value})} className="bg-[#facc15]/10 border-[#facc15]/30 text-[#facc15] font-black" />
                  <p className="text-[8px] text-muted-foreground uppercase">The game will start exactly at this time for all users.</p>
                </div>
                <div className="space-y-2">
                  <Label>Next Winner Interval (Min)</Label>
                  <Input type="number" required value={newGame.next_winner_minutes} onChange={e => setNewGame({...newGame, next_winner_minutes: Number(e.target.value)})} className="bg-white/5 border-white/10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Live Instructions / Marketing Copy</Label>
                <textarea 
                  value={newGame.instructions} 
                  onChange={e => setNewGame({...newGame, instructions: e.target.value})} 
                  placeholder="Welcome to the game. Use your tickets to win grand prizes..."
                  className="w-full h-20 rounded-md border border-white/10 bg-white/5 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Photo URL (Optional)</Label>
                <Input placeholder="https://image-link.com/..." value={newGame.photo_url} onChange={e => setNewGame({...newGame, photo_url: e.target.value})} className="bg-white/5 border-white/10" />
              </div>
              


              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Number of Winners</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="10" 
                    required 
                    value={newGame.winners_count} 
                    onChange={e => {
                      const count = Number(e.target.value);
                      const newPrizes = Array.from({ length: count }).map((_, i) => ({
                        rank: i + 1,
                        percentage: i === 0 ? 100 : 0
                      }));
                      setNewGame({...newGame, winners_count: count, prizes: newPrizes});
                    }} 
                    className="bg-white/5 border-white/10" 
                  />
                </div>
                <div className="space-y-2">
                   <Label>Prize Percentages</Label>
                   <div className="grid grid-cols-2 gap-2">
                      {newGame.prizes.map((p, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="text-[8px] font-black text-white/40">{p.rank}:</span>
                          <Input 
                            type="number" 
                            className="h-7 text-[10px] bg-white/5 border-white/10" 
                            value={p.percentage}
                            onChange={(e) => {
                              const updatedPrizes = [...newGame.prizes];
                              updatedPrizes[i].percentage = Number(e.target.value);
                              setNewGame({...newGame, prizes: updatedPrizes});
                            }}
                          />
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <input 
                  type="checkbox" 
                  id="botPlay"
                  checked={newGame.is_bot_play}
                  onChange={e => setNewGame({...newGame, is_bot_play: e.target.checked})}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary"
                />
                <Label htmlFor="botPlay" className="cursor-pointer">Enable Bot Play</Label>
              </div>
              <Button type="submit" disabled={isCreating} className="w-full mt-4 font-black italic">
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'GENERATE GAME'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {games.length === 0 && (
         <div className="text-center py-20 text-muted-foreground font-black uppercase tracking-widest text-xs opacity-50 bg-white/5 rounded-2xl border border-white/5">
           No active game modules detected in MongoDB
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <Card key={game.id || game._id} className="bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden group hover:border-primary/30 transition-all duration-300">
            <div className="relative h-40 w-full overflow-hidden bg-black/40">
              {game.photo_url ? (
                <img src={game.photo_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary/20">
                  <Gamepad2 className="w-20 h-20" />
                </div>
              )}
              <div className="absolute top-4 right-4">
                <Badge className={game.is_active ? 'bg-green-500' : 'bg-red-500'}>
                  {game.is_active ? 'ONLINE' : 'OFFLINE'}
                </Badge>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-xl font-black italic uppercase tracking-tighter text-white">{game.name}</CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest font-bold line-clamp-1">{game.game_type === 'slot_raffle' ? 'Slot-Style Raffle' : 'Standard Raffle'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Tickets & Price</p>
                  <p className="text-sm font-black text-white">{game.total_tickets} @ ৳{game.ticket_price}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#facc15]/5 border border-[#facc15]/20 col-span-2">
                  <p className="text-[8px] font-black uppercase text-[#facc15] mb-1 flex items-center gap-1">
                    <Clock className="w-2 h-2" /> Global Draw Sync
                  </p>
                  <p className="text-[10px] font-black text-[#facc15]/90">
                    {game.draw_date ? new Date(game.draw_date).toLocaleString() : 'AUTO-PLAY MODE'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-muted-foreground uppercase">Live Entry Stats</span>
                  <span className="text-[10px] font-black italic text-primary">{game.soldTickets || 0} / {game.total_tickets || 100} TIX</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-muted-foreground uppercase">Unique Buyers</span>
                  <span className="text-[10px] font-black italic text-[#facc15]">{game.buyersCount || 0} MEMBERS</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Link href={`/admin/games/${game.id || game._id}`} className="flex-1">
                  <Button className="w-full font-black italic uppercase tracking-widest text-[10px] h-11 bg-white/5 border border-white/10 hover:bg-white/10 group-hover:bg-primary group-hover:text-white transition-all">
                    CONFIGURE ENGINE
                    <Settings2 className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Button 
                  onClick={() => handleDelete(game.id || game._id, game.name)}
                  variant="destructive" 
                  className="w-12 h-11 shrink-0 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
