
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Home, 
  ShieldCheck, 
  LogOut,
  Gamepad2,
  Activity,
  Bot,
  Ticket
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { useUser } from '@/firebase';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function AdminSidebar() {
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('hub_user');
      window.dispatchEvent(new Event('local-auth-change'));
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('hub_user');
      window.dispatchEvent(new Event('local-auth-change'));
      router.push('/');
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/admin' },
    { id: 'registry', label: 'System Registry', icon: Activity, href: '/admin/tickets' },
    { id: 'servers', label: 'Server Monitor', icon: Activity, href: '/admin/servers' },
    { id: 'bots', label: 'Bot Manager', icon: Bot, href: '/admin/bots' },
    { id: 'users', label: 'User Directory', icon: Users, href: '/admin/users' },
    { id: 'raffle', label: 'Raffle Manager', icon: Ticket, href: '/admin/raffle' },
    { id: 'games', label: 'Game Manager', icon: Gamepad2, href: '/admin/games' },
  ];

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(91,87,233,0.4)]">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col overflow-hidden transition-all group-data-[collapsible=icon]:opacity-0">
            <span className="font-black italic tracking-tighter text-sm uppercase leading-none">COMMAND</span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">CENTER</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    className="font-bold italic"
                  >
                    <Link href={item.href}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.label.toUpperCase()}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Return to Hub" className="font-bold italic">
                  <Link href="/">
                    <Home className="w-4 h-4" />
                    <span>RETURN TO HUB</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-0">
              <Avatar className="h-8 w-8 border border-white/10">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary font-black text-xs">
                  {user?.displayName?.[0] || user?.email?.[0].toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden transition-all group-data-[collapsible=icon]:opacity-0">
                <span className="text-[10px] font-black text-white truncate">{user?.displayName || user?.email}</span>
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Administrator</span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-2">
            <SidebarMenuButton 
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 font-bold italic"
            >
              <LogOut className="w-4 h-4" />
              <span>LOGOUT SYSTEM</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
