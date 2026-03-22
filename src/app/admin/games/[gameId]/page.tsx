
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
// Fully Mongoose-driven file no longer relying on direct client-side Supabase queries
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ChevronLeft, 
  Loader2, 
  Save, 
  Gamepad2,
  Settings,
  Clock,
  Users,
  Percent,
  UploadCloud,
  FileText,
  Type,
  Database,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import Script from 'next/script';

declare global {
  interface Window {
    cloudinary: any;
  }
}

export default function GameConfigPage() {
  const params = useParams();
  const gameId = params?.gameId as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [game, setGame] = useState<any>(null);
  
  const [formData, setFormData] = useState<any>({
    name: '',
    instructions: '',
    photo_url: '',
    min_bet: 0,
    max_bet: 0,
    preset_bets: [],
    auto_play_seconds: 0,
    payout_multiplier: 1.0,
    min_players: 1,
    max_players: 100,
    is_active: true
  });

  const [presetsInput, setPresetsInput] = useState('');

  const fetchGame = async () => {
    if (!gameId) return;
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/admin/games/${gameId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch MongoDB game data');
      }
      
      if (result.game) {
        const data = result.game;
        setGame(data);
        setFormData({
          name: data.name || '',
          instructions: data.instructions || '',
          photo_url: data.photo_url || '',
          min_bet: data.min_bet || 0,
          max_bet: data.max_bet || 0,
          preset_bets: data.preset_bets || [],
          auto_play_seconds: data.auto_play_seconds || 0,
          payout_multiplier: data.payout_multiplier || 1.0,
          min_players: data.min_players || 1,
          max_players: data.max_players || 100,
          is_active: data.is_active ?? true
        });
        setPresetsInput((data.preset_bets || []).join(', '));
      } else {
        toast({ variant: "destructive", title: "Engine Missing", description: "The requested game core record does not exist in the database." });
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      toast({ variant: "destructive", title: "Fetch Failed", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGame();
  }, [gameId]);

  const handleUpload = () => {
    if (!window.cloudinary) {
      toast({ variant: "destructive", title: "Widget Loading", description: "Cloudinary script is not yet available." });
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      toast({ 
        variant: "destructive", 
        title: "Config Error", 
        description: "Cloudinary credentials missing in .env file." 
      });
      return;
    }

    try {
      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: cloudName.trim(),
          uploadPreset: uploadPreset.trim(),
          multiple: false,
          resourceType: 'image',
          clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
          cropping: true,
          showAdvancedOptions: false,
          styles: {
            palette: {
              window: "#0B0E1B",
              windowBorder: "#5B57E9",
              tabIcon: "#5B57E9",
              menuIcons: "#5B57E9",
              textDark: "#FFFFFF",
              textLight: "#FFFFFF",
              link: "#5B57E9",
              action: "#5B57E9",
              inactiveTabIcon: "#FFFFFF",
              error: "#F43F5E",
              inProgress: "#5B57E9",
              complete: "#10B981",
              sourceBg: "#141A2E"
            }
          }
        },
        (error: any, result: any) => {
          if (!error && result && result.event === "success") {
            const imageUrl = result.info.secure_url;
            setFormData((prev: any) => ({ ...prev, photo_url: imageUrl }));
            toast({ title: "Asset Uploaded", description: "Cloudinary link synchronized. Click SAVE to persist." });
          } else if (error) {
            console.error('Upload widget error:', error);
            toast({ 
              variant: "destructive", 
              title: "Upload Failed", 
              description: error.message || "Ensure your preset is 'Unsigned' and Cloud Name is correct." 
            });
          }
        }
      );
      widget.open();
    } catch (e: any) {
      console.error('Widget open exception:', e);
      toast({ variant: "destructive", title: "Widget Error", description: e.message });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const presets = presetsInput.split(',')
        .map(p => parseFloat(p.trim()))
        .filter(p => !isNaN(p));

      const updatePayload = {
        name: formData.name,
        instructions: formData.instructions,
        photo_url: formData.photo_url || null,
        min_bet: parseFloat(formData.min_bet) || 0,
        max_bet: parseFloat(formData.max_bet) || 0,
        preset_bets: presets,
        auto_play_seconds: parseFloat(formData.auto_play_seconds) || 0,
        payout_multiplier: parseFloat(formData.payout_multiplier) || 1.0,
        min_players: parseInt(formData.min_players) || 1,
        max_players: parseInt(formData.max_players) || 100,
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      };

      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to sync to MongoDB Engine Database.");
      }

      setGame(result.game);
      toast({ title: "CORE SYNCED", description: "Operational parameters are now live in production." });
      
    } catch (err: any) {
      console.error('Save failed:', err);
      toast({ 
        variant: "destructive", 
        title: "SYNC FAILURE", 
        description: err.message
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Accessing Core Archives...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-20">
      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/games">
            <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-xl">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-tight">ENGINE <span className="text-primary">CONFIG</span></h1>
            <p className="text-muted-foreground text-xs font-black uppercase tracking-widest opacity-60">{game.name}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="font-black italic px-10 h-12 shadow-[0_0_20px_rgba(91,87,233,0.3)] uppercase tracking-widest text-[10px]">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          SAVE PARAMETERS
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden shadow-2xl">
            <div className="h-48 bg-black/40 overflow-hidden relative group">
              {formData.photo_url ? (
                <img src={formData.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary/10">
                  <Gamepad2 className="w-32 h-32" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button onClick={handleUpload} variant="outline" className="font-black italic uppercase tracking-widest text-[8px] bg-white/10 border-white/20">
                  <UploadCloud className="w-3 h-3 mr-2" />
                  UPLOAD NEW ASSET
                </Button>
              </div>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[10px] font-black uppercase text-muted-foreground">System Status</span>
                <div className="flex items-center gap-2">
                  <span className={formData.is_active ? 'text-green-400 font-bold text-xs' : 'text-red-400 font-bold text-xs'}>
                    {formData.is_active ? 'OPERATIONAL' : 'OFFLINE'}
                  </span>
                  <Switch 
                    checked={formData.is_active} 
                    onCheckedChange={(val) => setFormData({...formData, is_active: val})} 
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                 <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                   <Database className="w-3 h-3" /> ASSET PATH
                 </Label>
                 <div className="flex gap-2">
                   <input 
                      value={formData.photo_url || ''} 
                      onChange={(e) => setFormData({...formData, photo_url: e.target.value})}
                      placeholder="https://res.cloudinary.com/..."
                      className="flex h-10 w-full rounded-md border border-white/10 bg-background/50 px-3 text-[10px] font-mono font-bold text-primary truncate focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Button onClick={handleUpload} size="icon" className="h-10 w-10 shrink-0 bg-primary/20 hover:bg-primary/40 border-primary/20">
                      <UploadCloud className="w-4 h-4 text-primary" />
                    </Button>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden text-white">
            <CardHeader className="border-b border-white/5 pb-6">
              <CardTitle className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3">
                <Settings className="w-5 h-5 text-primary" />
                Operational <span className="text-primary">Logic</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Type className="w-3 h-3" /> Display Name
                  </Label>
                  <input 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-4 font-black text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Instructions
                  </Label>
                  <input 
                    value={formData.instructions || ''} 
                    onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                    className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-4 font-black text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Min Bet Amount</Label>
                  <input 
                    type="number"
                    value={formData.min_bet} 
                    onChange={(e) => setFormData({...formData, min_bet: e.target.value})}
                    className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-4 font-black text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Max Bet Amount</Label>
                  <input 
                    type="number"
                    value={formData.max_bet} 
                    onChange={(e) => setFormData({...formData, max_bet: e.target.value})}
                    className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-4 font-black text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Preset Bet Values (Comma separated)</Label>
                <input 
                  value={presetsInput} 
                  onChange={(e) => setPresetsInput(e.target.value)}
                  className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-4 font-black italic text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="2, 5, 10, 50, 100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Auto-Play Cycle (Seconds)
                  </Label>
                  <input 
                    type="number"
                    value={formData.auto_play_seconds} 
                    onChange={(e) => setFormData({...formData, auto_play_seconds: e.target.value})}
                    className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-4 font-black text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Percent className="w-3 h-3" /> Payout Multiplier
                  </Label>
                  <input 
                    type="number"
                    step="0.1"
                    value={formData.payout_multiplier} 
                    onChange={(e) => setFormData({...formData, payout_multiplier: e.target.value})}
                    className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-4 font-black text-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Users className="w-3 h-3" /> Min Players
                  </Label>
                  <input 
                    type="number"
                    value={formData.min_players} 
                    onChange={(e) => setFormData({...formData, min_players: e.target.value})}
                    className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-4 font-black text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Users className="w-3 h-3" /> Max Capacity
                  </Label>
                  <input 
                    type="number"
                    value={formData.max_players} 
                    onChange={(e) => setFormData({...formData, max_players: e.target.value})}
                    className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-4 font-black text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
