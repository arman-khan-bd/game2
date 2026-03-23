'use client';

import React from 'react';
import { 
  Users, 
  TrendingUp, 
  Activity, 
  Dices,
  Trophy,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const data = [
  { name: 'Mon', spins: 400, revenue: 2400 },
  { name: 'Tue', spins: 300, revenue: 1398 },
  { name: 'Wed', spins: 200, revenue: 9800 },
  { name: 'Thu', spins: 278, revenue: 3908 },
  { name: 'Fri', spins: 189, revenue: 4800 },
  { name: 'Sat', spins: 239, revenue: 3800 },
  { name: 'Sun', spins: 349, revenue: 4300 },
];

export default function AdminOverview() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-tight">COMMAND <span className="text-primary">OVERVIEW</span></h1>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest mt-1 flex items-center gap-2">
            <Activity className="w-3 h-3 text-green-500" />
            Real-time platform synchronization active
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 font-bold italic h-11">
            DOWNLOAD REPORT
          </Button>
          <Button className="font-black italic h-11 shadow-[0_0_20px_rgba(91,87,233,0.3)]">
            GENERATE AUDIT
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Players', value: '0', icon: Users, color: 'text-blue-400', trend: 'STABLE' },
          { label: 'Total Volume', value: '৳0', icon: TrendingUp, color: 'text-green-400', trend: 'STABLE' },
          { label: 'Active Games', value: '1', icon: Dices, color: 'text-accent', trend: 'STABLE' },
          { label: 'Big Jackpots', value: '0', icon: Trophy, color: 'text-yellow-400', trend: 'STABLE' },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden group hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className={`p-1.5 md:p-2 rounded-xl bg-white/5 border border-white/5 ${stat.color}`}>
                  <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <span className="text-[8px] md:text-[10px] font-black text-white/30 tracking-widest">{stat.trend}</span>
              </div>
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
              <h3 className="text-xl md:text-3xl font-black text-white">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-card/40 backdrop-blur-xl border-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-black italic uppercase tracking-tighter">Engagement <span className="text-primary">Metrics</span></CardTitle>
            <CardDescription className="text-xs uppercase tracking-widest font-bold">Spin volume across last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[350px] w-full flex items-center justify-center bg-black/5 rounded-3xl border border-dashed border-white/5">
               <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-10">Data Visualization Layer Initializing...</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-black italic uppercase tracking-tighter">System <span className="text-accent">Activity</span></CardTitle>
            <CardDescription className="text-xs uppercase tracking-widest font-bold">Live game notifications</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
             <div className="p-12 text-center space-y-4">
                <Activity className="w-10 h-10 text-white/5 mx-auto" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-relaxed">System Synchronized<br/>Waiting for live interactions...</p>
             </div>
          </CardContent>
          <div className="p-4 border-t border-white/5 text-center">
            <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest hover:bg-white/5">
              View All Logs
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
