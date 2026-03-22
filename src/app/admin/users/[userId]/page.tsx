
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ChevronLeft, 
  Loader2, 
  Save, 
  Wallet, 
  Shield, 
  History, 
  MapPin, 
  Globe,
  Trash2,
  UserCheck,
  AlertCircle,
  Terminal
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UserEditPage() {
  const params = useParams();
  const userId = params?.userId as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<any>({
    full_name: '',
    username: '',
    email: '',
    password: '',
    address: '',
    role: 'user',
    balance: 0,
    status: 'active',
    photo_url: '',
    agent_id: '',
    ip_address: '',
    location: '',
    total_wagered: 0,
    total_won: 0
  });

  useEffect(() => {
    async function fetchUser() {
      if (!userId || userId === "null" || userId === "undefined" || userId.length < 32) {
         setFetchError("Invalid Player Identifier format. Expected valid UUID.");
         setIsLoading(false);
         return;
      }

      setIsLoading(true);
      setFetchError(null);
      
      try {
        const response = await fetch(`/api/admin/users/${userId}`);
        const result = await response.json();
        
        if (!response.ok) {
          console.error('Fetch error:', result.error);
          setFetchError(result.error || 'Failed to fetch MongoDB profile');
        } else if (result.profile) {
          const data = result.profile;
          setProfile(data);
          setFormData({
            full_name: data.full_name || '',
            username: data.username || '',
            email: data.email || '',
            password: data.password || 'managed_by_firebase',
            address: data.address || data.location || '',
            role: data.role || 'user',
            balance: data.balance || 0,
            status: data.status || 'active',
            photo_url: data.photo_url || '',
            agent_id: data.agent_id || '',
            ip_address: data.ip_address || '',
            location: data.location || '',
            total_wagered: data.total_wagered || 0,
            total_won: data.total_won || 0
          });
        } else {
          setFetchError("Player record not found in database.");
        }
      } catch (err: any) {
        setFetchError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || userId.length < 32) {
      toast({ variant: "destructive", title: "Sync Blocked", description: "Invalid system identifier detected." });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        full_name: formData.full_name || null,
        username: formData.username || null,
        email: formData.email || null,
        password: formData.password || null,
        address: formData.address || null,
        role: formData.role || 'user',
        balance: parseFloat(formData.balance) || 0,
        status: formData.status || 'active',
        photo_url: formData.photo_url || null,
        agent_id: !formData.agent_id ? null : formData.agent_id,
        ip_address: formData.ip_address || null,
        location: formData.location || null,
        total_wagered: parseFloat(formData.total_wagered) || 0,
        total_won: parseFloat(formData.total_won) || 0,
      };

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);
      
      toast({ title: "Audit Synchronized", description: "Player parameters updated and live in core registry." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Sync Failed", description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('TERMINATION CONFIRMATION: Are you sure you want to remove this player from the system? This action is irreversible.')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      toast({ title: "ENTITY PURGED", description: "The player account has been removed from the central database." });
      router.push('/admin/users');
    } catch (err: any) {
      toast({ variant: "destructive", title: "PURGE FAILED", description: err.message });
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Accessing Command Archives...</p>
      </div>
    );
  }

  const isRecursionError = fetchError?.toLowerCase().includes('infinite recursion');

  if (fetchError || !profile) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-12 bg-card/40 border border-white/5 rounded-3xl backdrop-blur-xl text-center space-y-8">
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${isRecursionError ? 'bg-orange-500/10 text-orange-400' : 'bg-red-500/10 text-red-400'}`}>
           <AlertCircle className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">{isRecursionError ? 'Policy Restriction' : 'Data Sync Failure'}</h2>
          <p className="text-muted-foreground mt-3 font-medium opacity-80 leading-relaxed">
            {fetchError || "The requested player data could not be loaded from the secure sector."}
          </p>
        </div>
        <div className="flex justify-center gap-4 pt-4">
          <Link href="/admin/users">
            <Button variant="outline" className="font-black italic uppercase tracking-widest px-8 py-6 h-auto bg-white/5 border-white/10 hover:bg-white/10">
              RETURN TO DIRECTORY
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const winRate = formData.total_wagered > 0 
    ? ((formData.total_won / formData.total_wagered) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-xl">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-tight">EDIT <span className="text-primary">PLAYER</span></h1>
            <p className="text-muted-foreground text-xs font-black uppercase tracking-widest opacity-60">{profile.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleDelete}
            disabled={isDeleting}
            className="font-black italic px-8 h-12 uppercase tracking-widest text-[10px] border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            TERMINATE ENTITY
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="font-black italic px-10 h-12 shadow-[0_0_20px_rgba(91,87,233,0.3)] uppercase tracking-widest text-[10px]">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            APPLY PARAMETERS
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden shadow-2xl">
            <CardHeader className="text-center pb-2">
              <div className="relative mx-auto w-36 h-36 mb-6 group">
                <Avatar className="w-full h-full border-4 border-background shadow-2xl ring-4 ring-primary/10">
                  <AvatarImage src={formData.photo_url} />
                  <AvatarFallback className="text-5xl font-black bg-primary/20 text-primary italic">
                    {formData.username?.[0] || 'P'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 bg-primary p-2 rounded-xl shadow-lg">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-black text-white italic uppercase tracking-tighter">{formData.username || 'PLAYER_ENTITY'}</CardTitle>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge className={formData.status === 'active' ? 'bg-green-500 font-black italic px-3' : formData.status === 'suspended' ? 'bg-yellow-500 font-black italic px-3' : 'bg-red-500 font-black italic px-3'}>
                  {(formData.status || 'active').toUpperCase()}
                </Badge>
                <Badge variant="outline" className="border-white/10 font-black italic uppercase tracking-widest px-3">{(formData.role || 'user').toUpperCase()}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-accent" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Operational Balance</span>
                </div>
                <span className="text-2xl font-black text-accent">${parseFloat(formData.balance || 0).toLocaleString()}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                 <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center shadow-inner">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Total Stake</p>
                    <p className="text-lg font-black italic tracking-tighter">${parseFloat(formData.total_wagered || 0).toLocaleString()}</p>
                 </div>
                 <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center shadow-inner">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Win Ratio</p>
                    <p className="text-lg font-black text-primary italic tracking-tighter">{winRate}%</p>
                 </div>
              </div>

              <div className="space-y-4 pt-6 mt-2 border-t border-white/5">
                <div className="flex items-center gap-3 text-xs font-bold">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="uppercase tracking-widest text-muted-foreground text-[10px]">Network:</span>
                  <span className="text-white font-mono ml-auto">{formData.ip_address || 'NOT LOGGED'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="uppercase tracking-widest text-muted-foreground text-[10px]">Location:</span>
                  <span className="text-white ml-auto italic">{formData.location || 'GLOBAL'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full bg-card/40 border border-white/5 p-1 rounded-2xl mb-8">
              <TabsTrigger value="general" className="flex-1 font-black italic text-[11px] py-4 uppercase tracking-[0.2em] rounded-xl">IDENTITY</TabsTrigger>
              <TabsTrigger value="financials" className="flex-1 font-black italic text-[11px] py-4 uppercase tracking-[0.2em] rounded-xl">FINANCIALS</TabsTrigger>
              <TabsTrigger value="activity" className="flex-1 font-black italic text-[11px] py-4 uppercase tracking-[0.2em] rounded-xl">AUDIT LOGS</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden">
                <CardHeader className="border-b border-white/5 pb-6">
                  <CardTitle className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-primary" />
                    Identity <span className="text-primary">Parameters</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Full Legal Name</Label>
                      <input 
                        value={formData.full_name} 
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-4 font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Platform Handle</Label>
                      <input 
                        value={formData.username} 
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-4 font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Email Address</Label>
                      <input 
                        type="email"
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-4 font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Physical Address / Location</Label>
                      <input 
                        value={formData.address} 
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-4 font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Account Password</Label>
                      <input 
                        value={formData.password} 
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Auth overrides local password"
                        disabled
                        className="flex h-12 w-full rounded-md border border-white/10 bg-background/20 px-4 font-bold text-muted-foreground focus:outline-none cursor-not-allowed"
                        title="Passwords are securely managed by Firebase Auth and cannot be directly edited here."
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Photo URL</Label>
                      <input 
                        value={formData.photo_url || ''} 
                        onChange={(e) => setFormData({...formData, photo_url: e.target.value})}
                        className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-4 font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Authorization Level</Label>
                      <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                        <SelectTrigger className="bg-background/50 border-white/10 h-12 font-black italic uppercase tracking-widest px-4 text-white">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-white/10 backdrop-blur-2xl">
                          <SelectItem value="user" className="font-black italic uppercase text-xs">Player</SelectItem>
                          <SelectItem value="agent" className="font-black italic uppercase text-xs text-blue-400">Agent</SelectItem>
                          <SelectItem value="moderator" className="font-black italic uppercase text-xs text-purple-400">Moderator</SelectItem>
                          <SelectItem value="admin" className="font-black italic uppercase text-xs text-red-500">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">System Status</Label>
                      <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                        <SelectTrigger className="bg-background/50 border-white/10 h-12 font-black italic uppercase tracking-widest px-4 text-white">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-white/10 backdrop-blur-2xl">
                          <SelectItem value="active" className="font-black italic uppercase text-xs text-green-400">Active</SelectItem>
                          <SelectItem value="suspended" className="font-black italic uppercase text-xs text-yellow-400">Suspended</SelectItem>
                          <SelectItem value="banned" className="font-black italic uppercase text-xs text-red-500">Terminated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financials" className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden">
                <CardHeader className="border-b border-white/5 pb-6">
                  <CardTitle className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-accent" />
                    Asset <span className="text-accent">Control</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Account Liquidity</Label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={formData.balance} 
                          onChange={(e) => setFormData({...formData, balance: e.target.value})}
                          className="flex h-14 w-full rounded-md border border-white/10 bg-background/50 pl-10 text-2xl font-black text-accent italic focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent font-black text-xl">$</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Agent ID Linkage</Label>
                      <input 
                        value={formData.agent_id || ''} 
                        onChange={(e) => setFormData({...formData, agent_id: e.target.value})}
                        className="flex h-14 w-full rounded-md border border-white/10 bg-background/50 px-4 font-mono uppercase tracking-[0.3em] text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="ASSOCIATED_ID"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden">
                <CardHeader className="border-b border-white/5 pb-6">
                  <CardTitle className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3">
                    <History className="w-5 h-5 text-primary" />
                    Network <span className="text-primary">Intelligence</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 text-center shadow-inner group hover:border-primary/30 transition-colors">
                      <p className="text-[9px] font-black text-muted-foreground uppercase mb-1 tracking-widest">Total Stake</p>
                      <p className="text-2xl font-black text-white italic tracking-tighter">${parseFloat(formData.total_wagered || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 text-center shadow-inner group hover:border-green-500/30 transition-colors">
                      <p className="text-[9px] font-black text-muted-foreground uppercase mb-1 tracking-widest">Total Yield</p>
                      <p className="text-2xl font-black text-green-400 italic tracking-tighter">${parseFloat(formData.total_won || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 text-center shadow-inner group hover:border-accent/30 transition-colors">
                      <p className="text-[9px] font-black text-muted-foreground uppercase mb-1 tracking-widest">Net ROI</p>
                      <p className={`text-2xl font-black italic tracking-tighter ${(formData.total_won || 0) - (formData.total_wagered || 0) >= 0 ? 'text-accent' : 'text-red-400'}`}>
                        ${((formData.total_won || 0) - (formData.total_wagered || 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
