"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";

export default function JDPrepCard() {
  const router = useRouter();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push("/dashboard/jd-prep")}
      className="relative group cursor-pointer rounded-2xl border-2 border-dashed border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all duration-300 p-6 flex flex-col items-center justify-center gap-3 min-h-[160px] overflow-hidden"
    >
      {/* Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Pulsing ring */}
      <div className="relative">
        <span className="absolute inset-0 rounded-xl bg-blue-500/20 animate-ping opacity-30" />
        <div className="relative h-12 w-12 rounded-xl bg-blue-500/15 flex items-center justify-center">
          <Building2 className="h-6 w-6 text-blue-500" />
        </div>
      </div>

      <div className="text-center">
        <p className="font-bold text-sm text-foreground">JD Interview Prep</p>
        <p className="text-xs text-muted-foreground mt-0.5">Real questions from the company</p>
      </div>
    </motion.div>
  );
}
