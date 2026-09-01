"use client";

import { ReactNode, useState, useEffect } from "react";
import WorkspaceShell from "@/components/WorkspaceShell";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";

export function MarketplacePageWrapper({ children }: { children: ReactNode }) {
  const [isWorkspaceUser, setIsWorkspaceUser] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token) {
        setIsWorkspaceUser(true);
      }
    }
  }, []);

  if (!isMounted) {
    return <StorefrontShell>{children}</StorefrontShell>;
  }

  if (isWorkspaceUser) {
    return <WorkspaceShell>{children}</WorkspaceShell>;
  }

  return <StorefrontShell>{children}</StorefrontShell>;
}
