
"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useAnimation } from "framer-motion";

interface RouletteWheelProps {
  spinning: boolean;
  winner: number | null;
  onAnimationComplete: (result: number) => void;
}

const NUMBERS_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export const RouletteWheel: React.FC<RouletteWheelProps> = ({ spinning, winner, onAnimationComplete }) => {
  const controls = useAnimation();
  const [rotation, setRotation] = useState(0);
  const anglePerSegment = 360 / 37;

  useEffect(() => {
    if (spinning && winner !== null) {
      const winnerIndex = NUMBERS_ORDER.indexOf(winner);
      const extraSpins = 10 + Math.floor(Math.random() * 6);
      const targetLanding = 360 - (winnerIndex * anglePerSegment + anglePerSegment / 2);
      const totalRotation = (extraSpins * 360) + targetLanding;
      const duration = 7 + Math.random() * 2;

      controls.start({
        rotate: totalRotation,
        transition: {
          duration: duration,
          ease: [0.12, 0, 0.15, 1],
        },
      }).then(() => {
        setRotation(totalRotation % 360);
        onAnimationComplete(winner);
      });
    }
  }, [spinning, winner, controls, onAnimationComplete, anglePerSegment]);

  return (
    <div className="relative w-full max-w-[320px] aspect-square">
      <div className="absolute inset-0 rounded-full border-[12px] border-[#926239] shadow-2xl z-10" />
      
      <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-30 drop-shadow-xl">
        <div className="w-8 h-10 bg-white" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
      </div>

      <motion.div
        animate={controls}
        initial={{ rotate: rotation }}
        className="w-full h-full rounded-full bg-[#3d0e0e] relative overflow-hidden shadow-inner border-[6px] border-[#c5a059]"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {NUMBERS_ORDER.map((num, i) => {
            const startAngle = i * anglePerSegment;
            const endAngle = (i + 1) * anglePerSegment;
            
            // Round to 10 decimal places to prevent hydration mismatches
            const x1 = (50 + 50 * Math.cos((Math.PI * startAngle) / 180)).toFixed(10);
            const y1 = (50 + 50 * Math.sin((Math.PI * startAngle) / 180)).toFixed(10);
            const x2 = (50 + 50 * Math.cos((Math.PI * endAngle) / 180)).toFixed(10);
            const y2 = (50 + 50 * Math.sin((Math.PI * endAngle) / 180)).toFixed(10);
            
            const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;
            const color = num === 0 ? "#15803d" : RED_NUMBERS.includes(num) ? "#dc2626" : "#171717";

            return (
              <g key={num}>
                <path d={pathData} fill={color} stroke="rgba(255,255,255,0.1)" strokeWidth="0.2" />
                <g transform={`rotate(${startAngle + anglePerSegment / 2} 50 50)`}>
                  <text
                    x="88"
                    y="50"
                    fill="white"
                    fontSize="3"
                    fontWeight="black"
                    textAnchor="middle"
                    className="select-none"
                    transform="rotate(90 88 50)"
                  >
                    {num}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-[#c5a059] via-[#926239] to-[#c5a059] shadow-2xl flex items-center justify-center border-4 border-[#3d0e0e]/30 z-20">
          <div className="w-12 h-12 rounded-full bg-[#3d0e0e] shadow-inner flex items-center justify-center">
             <div className="w-4 h-4 rounded-full bg-[#c5a059]/20 animate-pulse" />
          </div>
        </div>
      </motion.div>
      
      <div className="absolute inset-[15%] rounded-full border border-white/5 pointer-events-none z-10" />
    </div>
  );
};
