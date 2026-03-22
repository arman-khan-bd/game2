"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Phone, MapPin, Ticket, Plus, Minus, UserCheck, Users } from "lucide-react";

interface TicketFormProps {
  onSubmit: (data: { name: string; phone: string; address: string; quantity: number }) => void;
}

const PRE_USERS = [
  { name: "MD. Rakib Hossein", phone: "01712345678", address: "Dhanmondi, Dhaka" },
  { name: "Sumon Ahmed", phone: "01887654321", address: "Zindabazar, Sylhet" },
  { name: "Tania Akter", phone: "01911223344", address: "GEC, Chittagong" },
  { name: "Abir Khan", phone: "01655443322", address: "Rajshahi City" },
];

export const TicketForm: React.FC<TicketFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: ""
  });
  const [quantity, setQuantity] = useState(1);

  const selectPreUser = (user: typeof PRE_USERS[0]) => {
    setFormData({
      name: user.name,
      phone: user.phone,
      address: user.address
    });
  };

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
        {/* Quick Select Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#7da09d] tracking-widest ml-1">
            <Users className="w-3.5 h-3.5 text-[#facc15]" />
            Quick Select Profiles
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
            {PRE_USERS.map((user, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectPreUser(user)}
                className="px-4 py-2 rounded-xl bg-black/40 border border-white/5 text-[10px] font-bold text-white whitespace-nowrap hover:bg-[#facc15]/10 hover:border-[#facc15]/30 transition-all active:scale-95"
              >
                {user.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

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
             
             <Button className="flex-1 h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black italic text-xl uppercase tracking-tighter shadow-xl shadow-emerald-500/10">
                PURCHASE TICKETS (৳{quantity * 500})
             </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};