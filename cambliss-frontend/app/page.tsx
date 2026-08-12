import { NavBar } from "@/components/NavBar";

import { BentoGrid } from "@/components/BentoGrid";
import { TrustBar } from "@/components/TrustBar";
import { OfferBanner } from "@/components/OfferBanner";
import { ModuleDeepDives } from "@/components/ModuleDeepDives";
import { Testimonial } from "@/components/Testimonial";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full bg-background overflow-hidden selection:bg-brand/20">
      <NavBar />

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground-strong sm:text-7xl">
            The Ultimate <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-strong to-brand">
              Unified Workspace.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground-muted sm:text-xl">
            Office Connect is your centralized hub. We bring CRM, HRM, Video Calls, Inventory, and File Sharing into one seamless platform. <br/><br/>
            Already using other tools? No problem. Connect your favorite 3rd party software via API and manage everything from a single dashboard.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="w-full sm:w-auto flex justify-center items-center gap-2 rounded-full bg-brand-strong px-8 py-4 text-base font-bold text-white shadow-xl hover:bg-brand-strong/90 transition-all hover:scale-105"
            >
              Start free — no card required <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto flex justify-center items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-brand-strong shadow-sm border border-line hover:border-brand hover:text-brand transition-all"
            >
              Explore the platform
            </Link>
          </div>
          <div className="mt-8 text-sm text-foreground-muted font-medium">
            CRM, HRM, Video Calls, Inventory & File Sharing included free for your first 90 days*
          </div>
        </div>
      </div>

      <OfferBanner />

      <div id="features">
        <BentoGrid />
      </div>

      <ModuleDeepDives />
      <Testimonial />
      <FinalCTA />
      <Footer />

    </main>
  );
}
