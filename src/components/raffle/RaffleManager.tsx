
"use client";

import React, { useState, useCallback } from "react";
import { Plus, Trash2, Trophy, Play, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RaffleBoard } from "./RaffleBoard";
import { WinnerDialog } from "./WinnerDialog";
import confetti from "canvas-confetti";
import { useToast } from "@/hooks/use-toast";

export const RaffleManager = () => {
  const [participants, setParticipants] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [isWinnerDialogOpen, setIsWinnerDialogOpen] = useState(false);
  const { toast } = useToast();

  const addParticipant = (e?: React.FormEvent) => {
    e?.preventDefault();
    const name = inputValue.trim();
    if (!name) return;
    if (participants.includes(name)) {
      toast({
        title: "Already added",
        description: `${name} is already in the list.`,
        variant: "destructive",
      });
      return;
    }
    if (participants.length >= 24) {
      toast({
        title: "Limit reached",
        description: "The wheel is getting a bit crowded! Maximum 24 participants.",
        variant: "destructive",
      });
      return;
    }
    setParticipants([...participants, name]);
    setInputValue("");
  };

  const removeParticipant = (name: string) => {
    setParticipants(participants.filter((p) => p !== name));
  };

  const startSpin = () => {
    if (participants.length < 2) {
      toast({
        title: "Not enough participants",
        description: "You need at least 2 participants to spin the wheel.",
        variant: "destructive",
      });
      return;
    }

    setSpinning(true);
    // Deterministic landing before animation starts
    const winningIdx = Math.floor(Math.random() * participants.length);
    setWinnerIndex(winningIdx);
  };

  const onSpinEnd = useCallback(() => {
    setSpinning(false);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#5B57E9", "#7ED0FF", "#ffffff"],
    });
    setIsWinnerDialogOpen(true);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Hero Section */}
      <div className="text-center space-y-4 pt-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary animate-pulse">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-bold tracking-wider uppercase">Spin & Win Hub</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">
          WHEEL OF <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">FORTUNE</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Add your participants, give the wheel a mighty spin, and let fate decide the winner!
        </p>
      </div>

      {/* Wheel Display Area */}
      <div className="grid lg:grid-cols-5 gap-8 items-center">
        <div className="lg:col-span-3 bg-card/50 border border-border rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 right-0 p-6">
             <Trophy className="w-10 h-10 text-accent/20" />
          </div>
          
          <RaffleBoard 
            participants={participants} 
            spinning={spinning} 
            winnerIndex={winnerIndex} 
            onSpinEnd={onSpinEnd} 
          />

          <div className="mt-12 w-full flex justify-center">
            <Button 
              onClick={startSpin} 
              disabled={spinning || participants.length < 2}
              size="lg"
              className="h-20 px-16 text-2xl font-black rounded-full shadow-[0_20px_40px_rgba(91,87,233,0.4)] transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 group"
            >
              {spinning ? "SPINNING..." : "SPIN THE WHEEL"}
              <Play className="ml-4 w-8 h-8 fill-current group-hover:rotate-12 transition-transform" />
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {/* Input Area */}
          <Card className="border-border bg-card/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                Add Participants
              </CardTitle>
              <CardDescription>Populate the wheel segments with names.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={addParticipant} className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter a name..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={spinning}
                    className="h-11 bg-background/50 border-border/50 focus:border-primary"
                  />
                  <Button type="submit" size="icon" disabled={spinning} className="h-11 w-11 shrink-0">
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Max 24 participants for the best experience.
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Participant List */}
          <Card className="border-border bg-card/40 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Pool</CardTitle>
                <CardDescription>{participants.length} entries</CardDescription>
              </div>
              {participants.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setParticipants([])} 
                  disabled={spinning}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Clear All
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px] w-full pr-4">
                {participants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground opacity-50 space-y-2">
                    <Users className="w-12 h-12" />
                    <p>Wheel is empty</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {participants.map((name) => (
                      <div 
                        key={name}
                        className="flex items-center justify-between p-3 rounded-xl bg-background/40 border border-border group hover:border-primary/50 transition-colors"
                      >
                        <span className="font-medium truncate pr-2">{name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-transparent"
                          onClick={() => removeParticipant(name)}
                          disabled={spinning}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {winnerIndex !== null && (
        <WinnerDialog
          name={participants[winnerIndex]}
          open={isWinnerDialogOpen}
          onOpenChange={setIsWinnerDialogOpen}
        />
      )}
    </div>
  );
};
