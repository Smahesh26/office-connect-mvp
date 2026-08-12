"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Calculator,
  Users,
  Briefcase,
  Box,
  MessageSquare,
} from "lucide-react";

export function FloatingDock() {
  const mouseX = useMotionValue(Infinity);

  const items = [
    { name: "Accounting", icon: Calculator, href: "/login" },
    { name: "CRM", icon: Users, href: "/login" },
    { name: "HRM", icon: Briefcase, href: "/login" },
    { name: "Inventory", icon: Box, href: "/login" },
    { name: "Chat", icon: MessageSquare, href: "/login" },
    { name: "Dashboard", icon: LayoutDashboard, href: "/login" },
  ];

  return (
    <div className="fixed bottom-6 inset-x-0 mx-auto w-fit z-50">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="mx-auto flex h-16 items-end gap-4 rounded-full bg-white/70 border border-brand/20 px-4 pb-3 shadow-[0_8px_32px_rgba(102,120,193,0.15)] backdrop-blur-xl"
      >
        {items.map((item, idx) => (
          <DockItem key={idx} mouseX={mouseX} {...item} />
        ))}
      </motion.div>
    </div>
  );
}

function DockItem({
  mouseX,
  name,
  icon: Icon,
  href,
}: {
  mouseX: any;
  name: string;
  icon: any;
  href: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <Link href={href}>
      <motion.div
        ref={ref}
        style={{ width, height: width }}
        className="group relative flex aspect-square items-center justify-center rounded-2xl bg-brand-soft border border-brand/30 shadow-sm transition-colors hover:bg-white"
      >
        <div className="absolute -top-12 hidden rounded-lg bg-foreground px-3 py-1 text-xs text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100 whitespace-nowrap shadow-xl">
          {name}
        </div>
        <Icon className="h-1/2 w-1/2 text-brand-strong" />
      </motion.div>
    </Link>
  );
}
