
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
// Removed Supabase import since it's fully migrated to MongoDB
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAdminAccess() {
      if (isUserLoading) return;
      
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // Fetch the user's role natively from MongoDB via API Route for absolute security
        const res = await fetch(`/api/profile?uid=${user.uid}`);
        
        if (!res.ok) {
          throw new Error('Unauthorized or Profile not found');
        }

        const data = await res.json();
        const userRole = data.profile?.role;
        
        if (userRole !== 'admin') {
          console.warn('Unauthorized access attempt to admin sector.');
          router.push('/');
          setIsAdmin(false);
        } else {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error('Admin Access Check Error:', err);
        router.push('/');
        setIsAdmin(false);
      }
    }

    checkAdminAccess();
  }, [user, isUserLoading, router]);

  if (isUserLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#0b0e1b] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Authenticating Access</p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Command Authorization in Progress...</p>
        </div>
      </div>
    );
  }

  // Final defensive check
  if (!user || !isAdmin) return null;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-[#0b0e1b] text-white overflow-hidden">
        <AdminSidebar />
        <SidebarInset className="bg-transparent border-none flex flex-col">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white/5 px-6 backdrop-blur-md sticky top-0 z-50">
            <SidebarTrigger className="-ml-1 text-white/40 hover:text-white" />
            <div className="h-4 w-px bg-white/10 mx-2" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-xs font-black uppercase tracking-widest text-white/60">System Dashboard</span>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
