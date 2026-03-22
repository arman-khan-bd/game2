'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gift, Share2, Award, UserCircle } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Gift, label: 'Promotion', href: '/promotion' },
  { icon: Share2, label: 'Invite', href: '/invite', special: true },
  { icon: Award, label: 'Reward', href: '/reward' },
  { icon: UserCircle, label: 'Member', href: '/profile' }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#002d28]/95 backdrop-blur-xl border-t border-white/5 px-2 py-3 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-xl mx-auto flex items-end justify-between px-2">
        {navItems.map((item, i) => {
          const isActive = pathname === item.href;
          
          if (item.special) {
            return (
              <Link key={i} href={item.href} className="flex flex-col items-center -mt-8">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-[#044e45] shadow-[0_10px_20px_rgba(16,185,129,0.3)] border-4 border-[#001f1c] flex items-center justify-center group active:scale-95 transition-transform">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[9px] font-black uppercase mt-1 text-emerald-400 tracking-tighter">Invite</span>
              </Link>
            );
          }

          return (
            <Link key={i} href={item.href} className={`flex flex-col items-center gap-1 min-w-[60px] transition-colors ${isActive ? 'text-[#facc15]' : 'text-[#7da09d]'}`}>
              <item.icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} />
              <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}