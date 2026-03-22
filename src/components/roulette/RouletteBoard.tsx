
"use client";

import React from "react";
import { Bet, BetType } from "./RouletteGame";
import { cn } from "@/lib/utils";

interface RouletteBoardProps {
  currentBets: Bet[];
  onPlaceBet: (type: BetType, value: number | string) => void;
  disabled: boolean;
}

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export const RouletteBoard: React.FC<RouletteBoardProps> = ({ currentBets, onPlaceBet, disabled }) => {
  const getBetAmount = (type: BetType, value: number | string) => {
    return currentBets.find(b => b.type === type && b.value === value)?.amount || 0;
  };

  const renderChip = (amount: number) => {
    if (amount <= 0) return null;
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-yellow-400 text-black text-[8px] md:text-[10px] font-black border-2 border-black flex items-center justify-center shadow-lg animate-in zoom-in-50">
          {amount}
        </div>
      </div>
    );
  };

  const renderNumber = (num: number, className?: string) => {
    const isRed = RED_NUMBERS.includes(num);
    const amount = getBetAmount("number", num);
    const isZero = num === 0;

    return (
      <button
        key={num}
        disabled={disabled}
        onClick={() => onPlaceBet("number", num)}
        className={cn(
          "relative flex items-center justify-center border border-white/10 font-black transition-all hover:bg-white/10 active:scale-95",
          isZero ? "bg-[#15803d]" : isRed ? "bg-[#dc2626]" : "bg-[#171717]",
          className
        )}
      >
        <span className="md:rotate-0 rotate-90">{num}</span>
        {renderChip(amount)}
      </button>
    );
  };

  // Horizontal layout for desktop (3 rows, 12 columns)
  const desktopRows = [
    [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
    [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  ];

  // Mobile layout preparation (rows of 3)
  const mobileNumberRows = [];
  for (let i = 0; i < 12; i++) {
    mobileNumberRows.push([i * 3 + 3, i * 3 + 2, i * 3 + 1]);
  }

  return (
    <div className="w-full select-none">
      {/* DESKTOP VIEW */}
      <div className="hidden md:flex flex-col">
        <div className="flex">
          {/* Zero */}
          <button
            disabled={disabled}
            onClick={() => onPlaceBet("number", 0)}
            className="relative w-24 bg-[#15803d] border border-white/10 flex items-center justify-center text-2xl font-black rounded-l-3xl hover:bg-white/10 transition-all active:scale-95"
          >
            0
            {renderChip(getBetAmount("number", 0))}
          </button>

          <div className="flex-1 grid grid-rows-3">
            {desktopRows.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-12">
                {row.map(num => renderNumber(num, "h-20 text-xl"))}
              </div>
            ))}
          </div>
          
          {/* Column Bets 2:1 */}
          <div className="grid grid-rows-3">
            {["col3", "col2", "col1"].map((type) => {
               const amount = getBetAmount(type as BetType, type);
               return (
                <button
                  key={type}
                  disabled={disabled}
                  onClick={() => onPlaceBet(type as BetType, type)}
                  className="relative w-16 bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold hover:bg-white/10 transition-all active:scale-95"
                >
                  2:1
                  {renderChip(amount)}
                </button>
               );
            })}
          </div>
        </div>

        {/* Dozens */}
        <div className="ml-24 mr-16 grid grid-cols-3 gap-px mt-1 bg-white/10">
          {["1st 12", "2nd 12", "3rd 12"].map((label, i) => {
            const type = (["1st12", "2nd12", "3rd12"] as BetType[])[i];
            const amount = getBetAmount(type, type);
            return (
              <button
                key={label}
                disabled={disabled}
                onClick={() => onPlaceBet(type, type)}
                className="relative py-4 bg-white/5 hover:bg-white/10 font-bold uppercase tracking-widest text-sm border border-white/10 active:scale-95"
              >
                {label}
                {renderChip(amount)}
              </button>
            );
          })}
        </div>

        {/* Outside Bets */}
        <div className="ml-24 mr-16 grid grid-cols-6 gap-px mt-1 bg-white/10">
          {[
            { label: "1 to 18", type: "1-18", value: "1-18" },
            { label: "EVEN", type: "even", value: "even" },
            { label: "RED", type: "red", value: "red", color: "bg-[#dc2626]" },
            { label: "BLACK", type: "black", value: "black", color: "bg-[#171717]" },
            { label: "ODD", type: "odd", value: "odd" },
            { label: "19 to 36", type: "19-36", value: "19-36" },
          ].map(bet => {
            const amount = getBetAmount(bet.type as BetType, bet.value);
            return (
              <button
                key={bet.label}
                disabled={disabled}
                onClick={() => onPlaceBet(bet.type as BetType, bet.value)}
                className={cn(
                  "relative py-4 hover:bg-white/10 font-bold uppercase tracking-widest text-xs border border-white/10 active:scale-95 min-h-[50px]",
                  bet.color || "bg-white/5"
                )}
              >
                <span className={cn(bet.color && "px-2 py-0.5 rounded")}>{bet.label}</span>
                {renderChip(amount)}
              </button>
            );
          })}
        </div>
      </div>

      {/* MOBILE VIEW (VERTICAL PROFESSIONAL LAYOUT) */}
      <div className="flex md:hidden flex-row-reverse gap-2 justify-center pt-6 px-2 max-w-sm mx-auto">
        {/* NUMBER GRID SECTION */}
        <div className="flex flex-col flex-1 border border-white/20 rounded-2xl overflow-hidden bg-white/5 shadow-2xl">
          {/* 0 */}
          <button
            disabled={disabled}
            onClick={() => onPlaceBet("number", 0)}
            className="relative h-14 bg-[#15803d] border-b border-white/10 flex items-center justify-center text-2xl font-black active:scale-95"
          >
            <span className="rotate-90">0</span>
            {renderChip(getBetAmount("number", 0))}
          </button>
          {/* 1-36 */}
          <div className="flex-1 grid grid-cols-3">
             {mobileNumberRows.map((row, rIdx) => (
                <React.Fragment key={rIdx}>
                   {row.map(num => renderNumber(num, "h-14 text-base border-r border-b last:border-r-0"))}
                </React.Fragment>
             ))}
          </div>
          {/* Column Bets 2:1 */}
          <div className="grid grid-cols-3 h-12 border-t border-white/10">
            {["col3", "col2", "col1"].map((type) => (
              <button
                key={type}
                disabled={disabled}
                onClick={() => onPlaceBet(type as BetType, type)}
                className="relative flex items-center justify-center text-xs font-bold border-r border-white/10 last:border-r-0 active:scale-95 bg-white/5"
              >
                <span className="rotate-90">2:1</span>
                {renderChip(getBetAmount(type as BetType, type))}
              </button>
            ))}
          </div>
        </div>

        {/* DOZENS SECTION */}
        <div className="flex flex-col w-14 border border-white/20 rounded-2xl overflow-hidden bg-white/5 shadow-2xl">
           {[
             { label: "1 to 12", type: "1st12" },
             { label: "13 to 24", type: "2nd12" },
             { label: "25 to 36", type: "3rd12" }
           ].map(d => (
             <button
                key={d.type}
                disabled={disabled}
                onClick={() => onPlaceBet(d.type as BetType, d.type)}
                className="relative flex-1 flex items-center justify-center border-b border-white/10 last:border-b-0 text-[11px] font-black uppercase active:scale-95 hover:bg-white/10"
             >
                <span className="rotate-90 whitespace-nowrap">{d.label}</span>
                {renderChip(getBetAmount(d.type as BetType, d.type))}
             </button>
           ))}
        </div>

        {/* OUTSIDE BETS SECTION */}
        <div className="flex flex-col w-14 border border-white/20 rounded-2xl overflow-hidden bg-white/5 shadow-2xl">
           {[
             [
                { label: "1 to 18", type: "1-18", value: "1-18" },
                { label: "Even", type: "even", value: "even" }
             ],
             [
                { label: "Red", type: "red", value: "red", color: "bg-[#dc2626]" },
                { label: "Black", type: "black", value: "black", color: "bg-[#171717]" }
             ],
             [
                { label: "Odd", type: "odd", value: "odd" },
                { label: "19 to 36", type: "19-36", value: "19-36" }
             ]
           ].map((group, gIdx) => (
             <React.Fragment key={gIdx}>
                {group.map(bet => (
                   <button
                    key={bet.label}
                    disabled={disabled}
                    onClick={() => onPlaceBet(bet.type as BetType, bet.value)}
                    className={cn(
                      "relative flex-1 flex items-center justify-center border-b border-white/10 last:border-b-0 text-[11px] font-black uppercase active:scale-95",
                      bet.color || "bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <span className="rotate-90 whitespace-nowrap">{bet.label}</span>
                    {renderChip(getBetAmount(bet.type as BetType, bet.value))}
                  </button>
                ))}
             </React.Fragment>
           ))}
        </div>
      </div>
    </div>
  );
};
