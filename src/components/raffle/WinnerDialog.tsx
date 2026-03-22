
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Share2, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WinnerDialogProps {
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WinnerDialog: React.FC<WinnerDialogProps> = ({
  name,
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-primary/30 shadow-[0_0_50px_rgba(91,87,233,0.3)] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        
        <DialogHeader className="pt-8 items-center text-center">
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 10, stiffness: 100 }}
            className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4 border-2 border-primary/50"
          >
            <Trophy className="w-12 h-12 text-accent" />
          </motion.div>
          <DialogTitle className="text-3xl font-black text-white">WE HAVE A WINNER!</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Congratulations to our lucky raffle winner!
          </DialogDescription>
        </DialogHeader>

        <div className="py-10 flex flex-col items-center justify-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="px-8 py-4 rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-xl border border-white/20 relative group"
          >
             <div className="absolute inset-0 bg-accent/20 blur-xl group-hover:blur-2xl transition-all rounded-full opacity-50" />
             <span className="text-4xl md:text-5xl font-black text-white relative z-10 tracking-tight">
                {name}
             </span>
          </motion.div>
        </div>

        <DialogFooter className="sm:justify-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="rounded-full font-bold h-11"
          >
            <RotateCcw className="mr-2 w-4 h-4" />
            DRAW AGAIN
          </Button>
          <Button 
            className="rounded-full font-bold h-11 bg-primary hover:bg-primary/90"
          >
            <Share2 className="mr-2 w-4 h-4" />
            ANNOUNCE
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
