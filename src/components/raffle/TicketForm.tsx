"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Phone, MapPin, Ticket, Plus, Minus, UserCheck, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketFormProps {
  onSubmit: (data: { name: string; phone: string; address: string; quantity: number }) => void;
  ticketPrice?: number;
  balance?: number;
}

export const TicketForm: React.FC<TicketFormProps> = ({ onSubmit, ticketPrice = 1, balance = 0 }) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: ""
  });
  const [quantity, setQuantity] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) return;
    onSubmit({ ...formData, quantity });
    setFormData({ name: "", phone: "", address: "" });
    setQuantity(1);
  };

  return (
    <Card className="bg-[#002d28] border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
      <CardHeader className="border-b border-white/5 pb-6">
        <CardTitle className="text-xl font-black italic uppercase text-[#facc15] flex items-center gap-2">
          <Ticket className="w-5 h-5" /> Ticket <span className="text-white">Registration</span>
        </CardTitle>
        <CardDescription className="text-xs font-bold uppercase tracking-widest text-[#7da09d]">
          Enter details to encrypt your entry into the grand pool
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-8 space-y-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#7da09d] tracking-widest ml-1">Full Name</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#facc15]" />
                <Input 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="h-14 bg-black/40 border-white/5 pl-12 font-bold text-white rounded-2xl focus:border-[#facc15]"
                  placeholder="Lucky Winner"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#7da09d] tracking-widest ml-1">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#facc15]" />
                <Input 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="h-14 bg-black/40 border-white/5 pl-12 font-bold text-white rounded-2xl focus:border-[#facc15]"
                  placeholder="017XXXXXXXX"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-[#7da09d] tracking-widest ml-1">Physical Address</Label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#facc15]" />
              <Input 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                className="h-14 bg-black/40 border-white/5 pl-12 font-bold text-white rounded-2xl focus:border-[#facc15]"
                placeholder="City, District, Area"
                required
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 pt-4">
             <div className="w-full md:w-auto space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#7da09d] tracking-widest ml-1">Ticket Quantity</Label>
                <div className="flex items-center gap-4 bg-black/40 p-2 rounded-2xl border border-white/5">
                   <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-10 w-10 rounded-xl hover:bg-white/5 text-[#7da09d]"
                   >
                     <Minus className="w-4 h-4" />
                   </Button>
                   <span className="text-2xl font-black italic w-12 text-center text-[#facc15]">{quantity}</span>
                   <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setQuantity(Math.min(20, quantity + 1))}
                    className="h-10 w-10 rounded-xl hover:bg-white/5 text-[#facc15]"
                   >
                     <Plus className="w-4 h-4" />
                   </Button>
                </div>
             </div>

             <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center px-1">
                  <Label className="text-[10px] font-black uppercase text-[#7da09d] tracking-widest">Transaction Authorization</Label>
                  <span className="text-[10px] font-black text-[#facc15] uppercase tracking-widest flex items-center gap-1.5">
                    <Wallet className="w-3 h-3" /> ৳{balance.toLocaleString()}
                  </span>
                </div>
                <Button 
                  disabled={balance < (quantity * ticketPrice)}
                  className={cn(
                    "w-full h-16 rounded-2xl font-black italic text-xl uppercase tracking-tighter shadow-xl transition-all",
                    balance < (quantity * ticketPrice) 
                      ? "bg-red-500/20 text-red-500 border border-red-500/30 cursor-not-allowed" 
                      : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/10"
                  )}
                >
                  {balance < (quantity * ticketPrice) ? "INSUFFICIENT BALANCE" : `PURCHASE TICKETS (৳${(quantity * ticketPrice).toLocaleString()})`}
                </Button>
             </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};