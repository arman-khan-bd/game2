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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Players', value: '1,284', icon: Users, color: 'text-blue-400', trend: '+12%' },
          { label: 'Total Volume', value: '$48,290', icon: TrendingUp, color: 'text-green-400', trend: '+5.4%' },
          { label: 'Active Games', value: '4', icon: Dices, color: 'text-accent', trend: 'STABLE' },
          { label: 'Big Jackpots', value: '12', icon: Trophy, color: 'text-yellow-400', trend: '+2' },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden group hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl bg-white/5 border border-white/5 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-white/30 tracking-widest">{stat.trend}</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-white">{stat.value}</h3>
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
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5B57E9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#5B57E9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#191A1F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 900 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#5B57E9" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-black italic uppercase tracking-tighter">System <span className="text-accent">Activity</span></CardTitle>
            <CardDescription className="text-xs uppercase tracking-widest font-bold">Live game notifications</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {[
                { user: 'CyberPlayer', game: 'Crash X', amount: '+$450', time: '2m ago', color: 'text-green-400' },
                { user: 'Lucky_Luke', game: 'Roulette', amount: '-$100', time: '5m ago', color: 'text-red-400' },
                { user: 'SlotQueen', game: 'Mega Slots', amount: '+$1,200', time: '12m ago', color: 'text-green-400' },
                { user: 'Admin_Test', game: 'Raffle', amount: 'WON', time: '18m ago', color: 'text-accent' },
                { user: 'Neo77', game: 'Crash X', amount: '-$50', time: '22m ago', color: 'text-red-400' },
              ].map((activity, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary">
                      {activity.user[0]}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white group-hover:text-primary transition-colors">{activity.user}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{activity.game}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-black ${activity.color}`}>{activity.amount}</p>
                    <p className="text-[10px] font-bold text-white/20 uppercase">{activity.time}</p>
                  </div>
                </div>
              ))}
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
