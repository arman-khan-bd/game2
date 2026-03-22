
"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface RaffleBoardProps {
  participants: string[];
  spinning: boolean;
  winnerIndex: number | null;
  onSpinEnd: () => void;
  duration?: number;
}

const COLORS = [
  "#facc15", // Primary Gold
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#f97316", // Orange
  "#06b6d4", // Cyan
  "#ec4899", // Pink
];

export const RaffleBoard: React.FC<RaffleBoardProps> = ({
  participants,
  spinning,
  winnerIndex,
  onSpinEnd,
  duration = 4,
}) => {
  const controls = useAnimation();
  const wheelPulseControls = useAnimation();
  const [currentRotation, setCurrentRotation] = useState(0);
  const [lastCount, setLastCount] = useState(participants.length);

  // Trigger a "pulse" animation on the whole wheel when a new ticket is added
  useEffect(() => {
    if (participants.length > lastCount) {
      wheelPulseControls.start({
        scale: [1, 1.03, 1],
        transition: { duration: 0.2, ease: "easeOut" }
      });
    }
    setLastCount(participants.length);
  }, [participants.length, lastCount, wheelPulseControls]);

  useEffect(() => {
    // Only trigger when spinning transitions to TRUE
    if (spinning && participants.length > 0 && winnerIndex !== null) {
      const displayCount = Math.min(participants.length, 24);
      const segmentAngle = 360 / displayCount;
      
      // Calculate index relative to the visual display count
      const visualWinnerIndex = winnerIndex % displayCount;
      
      // targetAngle is the relative rotation needed to align the segment with the top pointer
      const targetAngle = 360 - (visualWinnerIndex * segmentAngle + segmentAngle / 2);
      
      const extraRevolutions = duration >= 60 ? 60 : 10;
      
      const currentMod = currentRotation % 360;
      const rotationToZero = 360 - currentMod;
      const newTotalRotation = currentRotation + rotationToZero + (extraRevolutions * 360) + targetAngle;

      controls.start({
        rotate: newTotalRotation,
        transition: {
          duration: duration,
          ease: [0.15, 0, 0.05, 1], // Custom "Aviator" style ease-out
        },
      }).then(() => {
        setCurrentRotation(newTotalRotation);
        onSpinEnd();
      });
    }
  }, [spinning, winnerIndex, duration, participants.length, currentRotation, controls, onSpinEnd]);

  if (participants.length === 0) {
    return (
      <div className="relative w-full max-w-[320px] aspect-square mx-auto flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-full border-4 border-dashed border-white/5">
        <p className="text-[#7da09d] font-black text-center px-8 italic uppercase tracking-widest opacity-40 text-[10px]">Purchase tickets to populate wheel</p>
      </div>
    );
  }

  const displayCount = Math.min(participants.length, 24);
  const segmentAngle = 360 / displayCount;

  return (
    <div className="relative w-full max-w-[400px] aspect-square mx-auto">
      {/* High-Fidelity Pointer */}
      <div className="absolute top-[-25px] left-1/2 -translate-x-1/2 z-40">
        <motion.div 
          animate={spinning ? { y: [0, -5, 0] } : {}}
          transition={{ repeat: Infinity, duration: 0.2 }}
          className="w-8 h-12 bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)] relative" 
          style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} 
        >
           <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
        </motion.div>
      </div>

      <motion.div
        animate={spinning ? controls : wheelPulseControls}
        initial={{ rotate: currentRotation }}
        className="w-full h-full rounded-full border-[12px] border-[#002d28] shadow-[0_0_80px_rgba(0,0,0,0.9),inset_0_0_40px_rgba(0,0,0,0.5)] overflow-hidden relative"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <AnimatePresence>
            {Array.from({ length: displayCount }).map((_, i) => {
              const startAngle = i * segmentAngle;
              const endAngle = (i + 1) * segmentAngle;
              
              const x1 = (50 + 50 * Math.cos((Math.PI * startAngle) / 180)).toFixed(5);
              const y1 = (50 + 50 * Math.sin((Math.PI * startAngle) / 180)).toFixed(5);
              const x2 = (50 + 50 * Math.cos((Math.PI * endAngle) / 180)).toFixed(5);
              const y2 = (50 + 50 * Math.sin((Math.PI * endAngle) / 180)).toFixed(5);
              
              const largeArcFlag = segmentAngle > 180 ? 1 : 0;
              const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

              const participantValue = participants[i];

              return (
                <motion.g 
                  key={`segment-${participantValue || i}`}
                  initial={{ opacity: 0, scale: 0, originX: "50px", originY: "50px" }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 260, 
                    damping: 20,
                    duration: 0.5 
                  }}
                >
                  <motion.path
                    d={pathData}
                    fill={COLORS[i % COLORS.length]}
                    stroke="rgba(0,0,0,0.2)"
                    strokeWidth="0.3"
                    animate={{ d: pathData }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.g 
                    animate={{ rotate: startAngle + segmentAngle / 2 }}
                    style={{ originX: "50px", originY: "50px" }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.text
                      x="92"
                      y="50"
                      fill="rgba(0,0,0,0.7)"
                      fontSize="3"
                      fontWeight="900"
                      textAnchor="end"
                      dominantBaseline="middle"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="select-none uppercase font-mono"
                      transform="rotate(90 92 50)"
                    >
                      #{participantValue ? participantValue.substring(0, 4) : '....'}
                    </motion.text>
                  </motion.g>
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>

        {/* Center Hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-[#001f1c] shadow-[0_0_30px_rgba(0,0,0,0.8),inset_0_0_15px_rgba(250,204,21,0.2)] border-4 border-[#002d28] z-20 flex items-center justify-center">
           <div className="w-6 h-6 rounded-full bg-[#facc15] animate-pulse shadow-[0_0_25px_rgba(250,204,21,0.8)]" />
        </div>
      </motion.div>
    </div>
  );
};
