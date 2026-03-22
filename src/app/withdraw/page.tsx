'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, useDoc, doc, updateDoc, increment } from '@/firebase';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ChevronLeft, 
  ArrowUpRight, 
  Loader2, 
  AlertCircle,
  Banknote,
  History
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { BottomNav } from '@/components/layout/BottomNav';

export default function WithdrawPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return `userProfiles/${user.uid}`;
  }, [firestore, user]);

  const { data: profile, isLoading: isDocLoading } = useDoc(profileRef);
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) router.push('/login');
  }, [user, isUserLoading, router]);

  const handleWithdraw = async () => {
    if (!user || !amount || !profile) return;
    
    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount <= 0) return;
    if (withdrawAmount > (profile.balance || 0)) {
      toast({ title: "INSUFFICIENT FUNDS", variant: "destructive", description: "Your vault balance is lower than the requested amount." });
      return;
    }

    setIsProcessing(true);
    try {
      await updateDoc(`userProfiles/${user.uid}`, {
        balance: increment(-withdrawAmount),
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "WITHDRAWAL PENDING",
        description: `৳ ${withdrawAmount.toLocaleString()} has been queued for processing.`,
      });
      router.push('/profile');
    } catch (error: any) {
      toast({ variant: "destructive", title: "TRANSITION ERROR", description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isUserLoading || isDocLoading) {
    return (
      <div className="min-h-screen bg-[#001f1c] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#facc15]" />
      </div>
    );
  }

  if (!user || !profile) return null;

  const currentBalance = profile.balance || 0;
  const canWithdraw = parseFloat(amount) > 0 && parseFloat(amount) <= currentBalance;

  return (
    <main className="min-h-screen bg-[#001f1c] text-white flex flex-col pb-24">
      <Header />
      
      <div className="px-4 py-8 max-w-xl mx-auto w-full">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-[#7da09d] hover:text-white group p-0">
              <ChevronLeft className="mr-1 w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              BACK TO HUB
            </Button>
          </Link>
        </div>

        <Card className="bg-[#002d28] border-white/5 shadow-2xl overflow-hidden rounded-3xl">
          <div className="h-2 bg-emerald-500" />
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
               <ArrowUpRight className="w-8 h-8 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">REQUEST <span className="text-emerald-500">WITHDRAWAL</span></CardTitle>
          </CardHeader>

          <CardContent className="space-y-8 pt-4">
            <div className="bg-black/20 p-6 rounded-2xl border border-white/5 flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7da09d] mb-1">Available Liquidity</span>
              <span className="text-3xl font-black text-white">৳ {currentBalance.toLocaleString()}</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-[#7da09d] ml-1">WITHDRAWAL AMOUNT</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-emerald-500 text-xl">৳</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-16 bg-black/40 border-white/5 text-2xl font-black pl-10 rounded-2xl focus:border-emerald-500 transition-colors"
                    placeholder="0"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#facc15] font-black italic text-xs hover:bg-white/5"
                    onClick={() => setAmount(currentBalance.toString())}
                  >
                    MAX
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                 <AlertCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                 <p className="text-[10px] text-emerald-200/60 font-medium leading-relaxed">
                   Withdrawals are processed manually for security audits. Standard processing time is 1-2 hours during hub operating windows.
                 </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6 pt-0">
            <Button 
              className="w-full h-16 text-xl font-black italic uppercase rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/10 transition-all"
              disabled={!canWithdraw || isProcessing}
              onClick={handleWithdraw}
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : 'PROCESS WITHDRAWAL'}
            </Button>
          </CardFooter>
        </Card>

        <Link href="/history" className="block mt-6">
           <Button variant="outline" className="w-full h-14 rounded-2xl border-white/5 bg-black/20 text-[#7da09d] font-black italic uppercase tracking-widest text-xs hover:text-white">
              <History className="w-4 h-4 mr-2" />
              TRANSACTION ARCHIVES
           </Button>
        </Link>
      </div>

      <BottomNav />
    </main>
  );
}
