"use client";

import { motion } from "framer-motion";
import { 
  Building2, 
  Users, 
  Box, 
  Wallet,
  ArrowRight,
  ShieldCheck,
  FileBox,
  CalendarCheck
} from "lucide-react";

export function BentoGrid() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24">
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-bold tracking-tight text-foreground-strong sm:text-5xl">
          Everything in one place
        </h2>
        <p className="mt-4 text-lg text-foreground-muted max-w-2xl mx-auto">
          Office Connect replaces the patchwork of tools most teams stitch together — finance, compliance, people, customers, and stock — with a single connected platform.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {/* Large Feature Card - CRM */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="col-span-1 flex flex-col justify-between overflow-hidden rounded-3xl bg-white/50 backdrop-blur-xl border border-brand/20 p-8 shadow-sm md:col-span-2 lg:col-span-2"
        >
          <div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10">
              <Users className="h-6 w-6 text-brand" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground-strong">Powerful CRM</h3>
            <p className="mt-2 text-foreground-muted">
              Track every deal and conversation in one pipeline, with reminders so no follow-up slips through.
            </p>
          </div>
          <div className="mt-8 flex items-center gap-2 text-sm font-medium text-brand">
            Explore CRM <ArrowRight className="h-4 w-4" />
          </div>
        </motion.div>

        {/* Medium Feature Card - HRM */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="col-span-1 flex flex-col justify-between overflow-hidden rounded-3xl bg-brand-strong p-8 text-white shadow-lg md:col-span-1 lg:col-span-2"
        >
          <div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-white">Modern HRM</h3>
            <p className="mt-2 text-brand-soft/80">
              Centralize employee records, leave, attendance, and onboarding into one self-serve hub for managers and staff.
            </p>
          </div>
          <div className="mt-8 flex items-center gap-2 text-sm font-medium text-white">
            Explore HRM <ArrowRight className="h-4 w-4" />
          </div>
        </motion.div>

        {/* Small Card - Inventory */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="col-span-1 flex flex-col justify-between overflow-hidden rounded-3xl bg-white/50 backdrop-blur-xl border border-brand/20 p-8 shadow-sm"
        >
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
              <Box className="h-5 w-5 text-brand" />
            </div>
            <h3 className="text-lg font-semibold text-foreground-strong">Inventory</h3>
            <p className="mt-2 text-sm text-foreground-muted">
              Know exactly what's in stock, where it sits, and when to reorder — across every location you run.
            </p>
          </div>
        </motion.div>

        {/* Small Card - GST Compliance */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="col-span-1 flex flex-col justify-between overflow-hidden rounded-3xl bg-white/50 backdrop-blur-xl border border-brand/20 p-8 shadow-sm"
        >
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
              <FileBox className="h-5 w-5 text-brand" />
            </div>
            <h3 className="text-lg font-semibold text-foreground-strong">GST Compliance</h3>
            <p className="mt-2 text-sm text-foreground-muted">
              Automate GSTR-1 and GSTR-3B filings directly from your accounting data with one click.
            </p>
          </div>
        </motion.div>

        {/* Horizontal Card - AI Finance Dashboard */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="col-span-1 flex flex-col justify-between overflow-hidden rounded-3xl bg-white/50 backdrop-blur-xl border border-brand/20 p-8 shadow-sm md:col-span-3 lg:col-span-2"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10">
              <Wallet className="h-6 w-6 text-brand" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground-strong">AI-Powered Finance Dashboard</h3>
              <p className="mt-2 text-foreground-muted">
                Get real-time visibility into revenue, expenses, and cash flow. Our integrated AI analyzes your metrics to automatically write executive summaries and CEO reports.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
