"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Zap } from "lucide-react";

export function NavBar() {
  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      className="fixed top-6 left-0 right-0 z-50 mx-auto flex w-full max-w-4xl items-center justify-between rounded-full bg-white/70 px-6 py-3 shadow-sm backdrop-blur-xl border border-brand/20"
    >
      <Link href="#" className="flex items-center gap-2">
        <img src="/officeconnectlogo.png" alt="Office Connect" className="h-12 w-auto object-contain" />
      </Link>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground-muted">
        <Link href="#features" className="hover:text-brand transition-colors">Features</Link>
        <Link href="#pricing" className="hover:text-brand transition-colors">Pricing</Link>
        <Link href="#about" className="hover:text-brand transition-colors">About</Link>
      </div>

      <div className="flex items-center gap-4">
        <Link 
          href="/login" 
          className="text-sm font-medium text-foreground-muted hover:text-brand transition-colors"
        >
          Sign in
        </Link>
        <Link 
          href="/register" 
          className="rounded-full bg-brand-strong px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-strong/90 transition-colors"
        >
          Start free
        </Link>
      </div>
    </motion.nav>
  );
}
