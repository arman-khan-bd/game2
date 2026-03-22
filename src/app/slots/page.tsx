
"use client";

import React, { useEffect } from "react";
import { SlotMachine } from "@/components/slots/SlotMachine";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";

export default function SlotsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/register');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#0f172a] text-white overflow-x-hidden relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent pointer-events-none" />
      
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
            MEGA <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">SLOTS</span>
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-xs">High Stakes Number Edition</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <SlotMachine />
        </div>
      </div>
    </main>
  );
}
