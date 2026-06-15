"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

const COULEURS = ["#22d3ee", "#a78bfa", "#60a5fa", "#f472b6", "#34d399", "#fbbf24"];

/** Petite animation de réussite (étincelles + coche) : devoir rendu, note reçue... */
export function SuccessBurst({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <span className="relative inline-flex h-7 w-7 items-center justify-center">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 16 }}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300"
          >
            <Check className="h-4 w-4" />
          </motion.span>
          {COULEURS.map((couleur, i) => (
            <motion.span
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: couleur }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos((i / COULEURS.length) * 2 * Math.PI) * 22,
                y: Math.sin((i / COULEURS.length) * 2 * Math.PI) * 22,
                opacity: 0,
                scale: 0.5,
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          ))}
        </span>
      )}
    </AnimatePresence>
  );
}
