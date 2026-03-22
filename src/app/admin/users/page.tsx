
'use client';

import React, { useState, useEffect } from 'react';
// Supabase library removed - now connecting to MongoDB API
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Loader2, 
  Mail, 
  Wallet,
  ShieldCheck,
  ShieldAlert,
  ShieldEllipsis,
  Edit2,
  Database,
  AlertCircle,
  RefreshCcw,
  Terminal,
  Trash2
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function UserDirectory() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProfiles = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch Data from MongoDB');
      } else {
        setProfiles(data.users || []);
      }
    } catch (err: any) {
      console.error('Fetch Error:', err);
      setFetchError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to terminate this player entity? This action cannot be reversed.')) return;

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user in DB');

      setProfiles(prev => prev.filter(p => p.id !== userId));
      toast({ title: "ENTITY TERMINATED", description: "Player record removed from central registry." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "TERMINATION FAILED", description: err.message });
    }
  };

  const getRoleBadge = (role: string) => {
    const r = (role || 'user').toLowerCase();
    switch(r) {
      case 'admin':
        return <Badge className="bg-red-500 font-black italic text-[8px]"><ShieldAlert className="w-2.5 h-2.5 mr-1" /> ADMIN</Badge>;
      case 'moderator':
        return <Badge className="bg-purple-500 font-black italic text-[8px]"><ShieldCheck className="w-2.5 h-2.5 mr-1" /> MOD</Badge>;
      case 'agent':
        return <Badge className="bg-blue-500 font-black italic text-[8px]"><ShieldEllipsis className="w-2.5 h-2.5 mr-1" /> AGENT</Badge>;
      default:
        return <Badge variant="secondary" className="font-black italic text-[8px] bg-white/5 border-white/10">PLAYER</Badge>;
    }
  }

  const filteredUsers = (profiles || []).filter(p => {
    if (!p) return false;
    const search = searchTerm.toLowerCase();
    const username = (p.username || '').toLowerCase();
    const email = (p.email || '').toLowerCase();
    const fullName = (p.full_name || '').toLowerCase();
    
    return username.includes(search) || email.includes(search) || fullName.includes(search);
  });

  const isRecursionError = fetchError?.toLowerCase().includes('infinite recursion');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-tight">USER <span className="text-primary">DIRECTORY</span></h1>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest mt-1 flex items-center gap-2">
            <Database className="w-3 h-3" />
            Live MongoDB Player Database
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchProfiles} 
          disabled={isLoading}
          className="border-white/10 bg-white/5 font-bold h-10 px-6"
        >
          <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          RELOAD SYSTEM
        </Button>
      </div>

      {fetchError && (
        <div className={`p-6 border rounded-2xl flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-top-2 ${isRecursionError ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          <div className="w-12 h-12 rounded-full bg-current/10 flex items-center justify-center shrink-0">
             <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs font-black uppercase tracking-widest mb-1">{isRecursionError ? 'Policy Recursion Detected' : 'Database Sync Failure'}</p>
            <p className="text-sm font-bold opacity-80 leading-relaxed mb-4">{fetchError}</p>
            
            {isRecursionError && (
              <div className="bg-black/40 p-4 rounded-xl border border-orange-500/20 space-y-3">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase text-orange-500">
                    <Terminal className="w-3 h-3" />
                    Required SQL Correction:
                 </div>
                 <code className="block text-[10px] font-mono text-orange-200/60 leading-tight">
                    CREATE POLICY "read_profiles_v2" ON profiles FOR SELECT USING (true);
                 </code>
                 <p className="text-[10px] opacity-60 font-medium leading-relaxed">
                   The recursion error is caused by a circular RLS policy. Run the non-recursive SQL fix provided by the assistant to restore access.
                 </p>
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={fetchProfiles} className="border-current/20 bg-current/10 hover:bg-current/20 font-black h-12 px-8 shrink-0">
            TRY AGAIN
          </Button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search accounts..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-card/40 border-white/10 rounded-xl focus:border-primary/50"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none border-white/10 bg-white/5 font-bold h-11 px-6 uppercase tracking-widest text-[10px]">
            <Filter className="w-4 h-4 mr-2" /> FILTER
          </Button>
          <Button className="flex-1 md:flex-none font-black italic h-11 px-8 shadow-[0_0_20px_rgba(91,87,233,0.3)] uppercase tracking-widest text-[10px]">
            ADD PLAYER
          </Button>
        </div>
      </div>

      <Card className="bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Synchronizing Platform Data...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Player Entity</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 text-right">Liquidity</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 text-right">Control</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!filteredUsers || filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-24 text-muted-foreground font-bold uppercase tracking-widest opacity-50">
                      {searchTerm ? 'No matching records' : 'No player data detected in MongoDB'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((p) => {
                    const safeId = p.id && typeof p.id === 'string' && p.id.length >= 32 ? p.id : null;
                    
                    return (
                      <TableRow key={p.id} className="border-white/5 hover:bg-white/5 transition-all group">
                        <TableCell className="py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black shadow-lg overflow-hidden shrink-0">
                              {p.photo_url ? (
                                <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                (p.username || p.email || 'P')[0].toUpperCase()
                              )}
                            </div>
                            <div className="overflow-hidden">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-black text-white group-hover:text-primary transition-colors truncate">{p.username || 'Anonymous'}</span>
                                {getRoleBadge(p.role)}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground truncate uppercase tracking-tighter">
                                <Mail className="w-2.5 h-2.5" />
                                {p.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`border-white/10 text-[8px] font-black uppercase tracking-widest ${p.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                            {(p.status || 'ACTIVE').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full">
                            <Wallet className="w-3 h-3 text-accent" />
                            <span className="text-sm font-black text-accent">${(parseFloat(p.balance) || 0).toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-3">
                            {safeId ? (
                              <Link href={`/admin/users/${safeId}`}>
                                <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/10 text-white/40 hover:text-white rounded-xl border border-transparent hover:border-white/10">
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              </Link>
                            ) : (
                              <Button variant="ghost" size="icon" disabled className="h-10 w-10 opacity-20">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/10 text-white/40 hover:text-white rounded-xl">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card/95 border-white/10 backdrop-blur-xl">
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/users/${safeId}`} className="w-full font-black italic uppercase text-[10px] tracking-widest cursor-pointer py-3 flex items-center gap-2">
                                    <Edit2 className="w-3.5 h-3.5" /> Modify Account
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="font-black italic uppercase text-[10px] tracking-widest cursor-pointer py-3">View Analytics</DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteUser(p.id)}
                                  className="text-destructive font-black italic uppercase text-[10px] tracking-widest cursor-pointer py-3 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Terminate Access
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
