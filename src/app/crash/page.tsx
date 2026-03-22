
"use client";

import React, { useEffect } from "react";
import { CrashGame } from "@/components/crash/CrashGame";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CrashPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/register');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-[#0b0e1b] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#0b0e1b] text-white overflow-hidden flex flex-col">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1a1f35_0%,#0b0e1b_100%)]" />
        <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      </div>
      
      <div className="relative z-10 flex-1 flex flex-col">
        <CrashGame />
      </div>
    </main>
  );
}
