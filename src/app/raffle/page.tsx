
"use client";

import React, { useEffect, useState } from "react";
import { RaffleTicketSystem } from "@/components/raffle/RaffleTicketSystem";
import { Header } from "@/components/layout/Header";
import { ChevronLeft, Loader2, Ticket as TicketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";

export default function RafflePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/register');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-[#001f1c] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#facc15]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#001f1c] text-white flex flex-col relative overflow-hidden pb-24">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#facc15]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <Header />
      
      <div className="relative z-10 flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="group text-[#7da09d] hover:text-white p-0">
              <ChevronLeft className="mr-1 w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              BACK TO HUB
            </Button>
          </Link>
          <div className="flex items-center gap-2 bg-[#facc15]/10 border border-[#facc15]/20 px-4 py-1.5 rounded-full">
             <TicketIcon className="w-4 h-4 text-[#facc15]" />
             <span className="text-[10px] font-black uppercase tracking-widest text-[#facc15]">Raffle Draw Active</span>
          </div>
        </div>

        <RaffleTicketSystem />
      </div>

      <BottomNav />
    </main>
  );
}
