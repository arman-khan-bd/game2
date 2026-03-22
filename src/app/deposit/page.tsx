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
  Plus, 
  Loader2, 
  Zap,
  Wallet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { BottomNav } from '@/components/layout/BottomNav';

const PRESET_AMOUNTS = [100, 500, 1000, 2000, 5000, 10000];

export default function DepositPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return `userProfiles/${user.uid}`;
  }, [firestore, user]);

  const { data: profile, isLoading: isDocLoading } = useDoc(profileRef);
  const [amount, setAmount] = useState<string>('500');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) router.push('/login');
  }, [user, isUserLoading, router]);

  const handleDeposit = async () => {
    if (!user || !amount || parseFloat(amount) <= 0) return;

    setIsProcessing(true);
    const depositAmount = parseFloat(amount);

    try {
      await updateDoc(`userProfiles/${user.uid}`, {
        balance: increment(depositAmount),
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "DEPOSIT SUCCESSFUL",
        description: `৳ ${depositAmount.toLocaleString()} added to your vault.`,
      });
      router.push('/profile');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "TRANSITION FAILED",
        description: error.message,
      });
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
          <div className="h-2 bg-[#facc15]" />
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-[#facc15]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#facc15]/20">
               <Plus className="w-8 h-8 text-[#facc15]" />
            </div>
            <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">DEPOSIT <span className="text-[#facc15]">FUNDS</span></CardTitle>
          </CardHeader>

          <CardContent className="space-y-8 pt-4">
            <div className="bg-black/20 p-6 rounded-2xl border border-white/5 flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7da09d] mb-1">Current Vault</span>
              <div className="flex items-center gap-2">
                 <Wallet className="w-5 h-5 text-[#facc15]" />
                 <span className="text-3xl font-black text-white">৳ {(profile.balance || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                {PRESET_AMOUNTS.map((amt) => (
                  <Button
                    key={amt}
                    variant="outline"
                    className={`h-12 font-black italic rounded-xl border-white/5 transition-all ${
                      amount === amt.toString() 
                        ? 'bg-[#facc15] text-black border-[#facc15] scale-105' 
                        : 'bg-[#001f1c] text-[#7da09d] hover:bg-white/5'
                    }`}
                    onClick={() => setAmount(amt.toString())}
                  >
                    ৳{amt >= 1000 ? `${amt/1000}K` : amt}
                  </Button>
                ))}
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-[#7da09d] ml-1">CUSTOM AMOUNT</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#facc15] text-xl">৳</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-16 bg-black/40 border-white/5 text-2xl font-black pl-10 rounded-2xl focus:border-[#facc15] transition-colors"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6">
            <Button 
              className="w-full h-16 text-xl font-black italic uppercase rounded-2xl bg-[#facc15] hover:bg-yellow-400 text-black shadow-lg shadow-[#facc15]/10 group transition-all"
              disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
              onClick={handleDeposit}
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  CONFIRM DEPOSIT
                  <Zap className="ml-2 w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-8 bg-black/20 p-6 rounded-2xl border border-white/5 space-y-4">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#7da09d]">Secure Network Active</span>
           </div>
           <p className="text-[10px] text-[#7da09d] font-medium leading-relaxed italic">
             Funds are processed through our high-speed CV666 core and typically reflect instantly. For amounts exceeding ৳50,000, please contact priority support.
           </p>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
