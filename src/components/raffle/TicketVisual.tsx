
"use client";

import React, { useRef } from "react";
import { TicketData } from "./RaffleTicketSystem";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";

interface TicketVisualProps {
  ticket: TicketData;
}

export const TicketVisual: React.FC<TicketVisualProps> = ({ ticket }) => {
  const ticketRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (ticketRef.current === null) return;
    
    try {
      // Capture at original size for high quality
      // skipFonts: true avoids SecurityError on cross-origin stylesheets (e.g. Google Fonts)
      const dataUrl = await toPng(ticketRef.current, { 
        cacheBust: true, 
        pixelRatio: 3,
        skipFonts: true,
        fontEmbedCSS: "" // Force empty font CSS to avoid stylesheet rule search
      });
      const link = document.createElement('a');
      link.download = `CV666-ticket-${ticket.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center text-[#facc15]">Your Encrypted Entry</p>
      
      {/* Responsive Scaling Wrapper */}
      <div className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-[32px] bg-black/20 border border-white/5 flex items-center justify-center py-4">
        {/* 
          Aspect ratio placeholder to keep height proportional to width.
          Ticket is 800x320 (ratio 2.5:1).
        */}
        <div className="w-full aspect-[2.5/1] relative flex items-center justify-center">
          {/* 
            The actual ticket is fixed size for high-quality export.
            We scale it down to fit the parent's width using CSS transform based on breakpoints.
          */}
          <div className="absolute transform scale-[0.38] min-[400px]:scale-[0.45] min-[500px]:scale-[0.55] sm:scale-[0.75] md:scale-[0.9] lg:scale-100 origin-center transition-transform duration-500">
            <div 
              ref={ticketRef} 
              className="w-[800px] h-[320px] bg-white rounded-md overflow-hidden flex relative font-sans shadow-2xl"
              style={{ backgroundColor: '#ffcc00' }}
            >
              {/* Main Sunburst Background */}
              <div 
                className="absolute inset-0 z-0"
                style={{ 
                  background: 'repeating-conic-gradient(from 0deg at 50% 50%, #facc15 0deg 10deg, #eab308 10deg 20deg)'
                }}
              />

              {/* Internal Dashed Border */}
              <div className="absolute inset-4 border border-black/20 border-dashed z-10 pointer-events-none" />

              {/* Content Layer */}
              <div className="relative z-20 flex w-full h-full">
                {/* Left Section (Main Ticket) */}
                <div className="flex-1 p-8 flex flex-col justify-between relative overflow-hidden">
                  {/* Logo Area */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border-2 border-black font-black italic text-black">
                        Logo
                      </div>
                    </div>
                    <div className="px-4 py-1 bg-black/5 border border-black/10 text-[10px] font-bold text-black/60 uppercase">
                      Friday- 9PM Local
                    </div>
                  </div>

                  {/* Center Box */}
                  <div className="flex flex-col items-center justify-center flex-1">
                    <div className="border-[3px] border-black px-10 py-4 bg-transparent mb-4">
                      <h2 className="text-5xl font-black italic text-black tracking-tight uppercase">
                        RAFFLE TICKET
                      </h2>
                    </div>
                    
                    {/* Price Tag (Torn Paper Effect) */}
                    <div className="relative">
                      <div 
                        className="bg-[#ffe666] w-32 h-32 flex flex-col items-center justify-center shadow-xl rotate-[-2deg]"
                        style={{ 
                          clipPath: 'polygon(5% 0%, 95% 0%, 100% 5%, 100% 95%, 95% 100%, 5% 100%, 0% 95%, 0% 5%)'
                        }}
                      >
                        <span className="text-lg font-bold text-white uppercase tracking-widest drop-shadow-md">Price</span>
                        <span className="text-4xl font-black text-black">৳500</span>
                      </div>
                    </div>
                  </div>

                  {/* Left Barcode (Vertical) */}
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-48 bg-white/80 border border-black/10 flex flex-col items-center justify-center">
                    <div 
                      className="w-full h-full"
                      style={{ 
                        backgroundImage: 'linear-gradient(90deg, #000 1px, transparent 1px, transparent 3px, #000 3px, #000 4px, transparent 4px, transparent 6px, #000 6px)',
                        backgroundSize: '10px 100%'
                      }}
                    />
                    <span className="absolute rotate-90 text-[8px] font-mono text-black/40 whitespace-nowrap -bottom-10">cv666-secure-entry</span>
                  </div>
                </div>

                {/* Brush Splash Transition */}
                <div className="absolute right-[22%] top-0 h-full w-[15%] z-15 pointer-events-none overflow-hidden">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full fill-white opacity-90">
                    <path d="M0,0 Q30,50 0,100 L100,100 L100,0 Z" />
                  </svg>
                </div>

                {/* Right Section (Stub) */}
                <div className="w-[28%] bg-white p-8 border-l border-black/10 flex flex-col justify-between items-center text-black">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">CV666 Hub</p>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#8b7d00]">
                      {ticket.name.split(' ')[0]} Entry
                    </h3>
                  </div>

                  <div className="w-full border-t border-black/5 pt-4 space-y-2">
                    <p className="text-[10px] font-black uppercase text-gray-400 text-center mb-4">Ticket Information</p>
                    <div className="space-y-1 text-xs font-bold uppercase tracking-tighter">
                      <div className="flex justify-between"><span>User:</span> <span className="text-[#8b7d00]">{ticket.id}</span></div>
                      <div className="flex justify-between"><span>Qty:</span> <span className="text-[#8b7d00]">{ticket.ticketNumbers.length} Pass</span></div>
                      <div className="flex justify-between"><span>Row:</span> <span className="text-[#8b7d00]">VIP-66</span></div>
                      <div className="flex justify-between"><span>No:</span> <span className="text-[#8b7d00]">#{ticket.ticketNumbers[0]}</span></div>
                    </div>
                  </div>

                  {/* Horizontal Barcode */}
                  <div className="w-full h-12 bg-gray-50 border border-black/5 mt-4 relative overflow-hidden">
                    <div 
                      className="w-full h-full"
                      style={{ 
                        backgroundImage: 'linear-gradient(90deg, #000 1px, transparent 1px, transparent 2px, #000 2px, #000 3px, transparent 3px, transparent 5px, #000 5px)',
                        backgroundSize: '8px 100%'
                      }}
                    />
                    <p className="text-[7px] font-mono text-center mt-1 opacity-40">cv666-ticket-{ticket.id}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleDownload}
        className="w-full h-16 rounded-2xl bg-[#facc15] hover:bg-yellow-400 text-black font-black italic uppercase tracking-widest text-lg shadow-xl shadow-[#facc15]/10 group"
      >
        <Download className="w-6 h-6 mr-2 group-hover:-translate-y-1 transition-transform" />
        DOWNLOAD DIGITAL TICKET
      </Button>
    </div>
  );
};
