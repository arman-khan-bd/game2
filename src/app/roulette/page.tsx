
"use client";

import React, { useEffect } from "react";
import { RouletteGame } from "@/components/roulette/RouletteGame";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";

export default function RoulettePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/register');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-[#064e3b] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#064e3b] text-white overflow-x-hidden relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/felt.png')]" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 w-4 h-4" />
              BACK TO HUB
            </Button>
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-2 italic">
            CASINO <span className="text-[#facc15]">ROULETTE</span>
          </h1>
          <p className="text-white/60 font-medium uppercase tracking-widest">European Standard Layout</p>
        </div>

        <RouletteGame />
      </div>
    </main>
  );
}
