"use client";

import { useEffect, useState } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";
import { useSearchParams } from "next/navigation";

export default function AccountechEmbedded() {
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "";

  useEffect(() => {
    const fetchSsoToken = async () => {
      try {
        const response = await fetch('/api/auth/sso-token', {
          // ensure backend receives the httpOnly cookie
          credentials: "include", 
        });

        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            setIframeUrl(`http://localhost:5173/sso?token=${data.token}&embedded=true&returnTo=/${view}`);
            return;
          }
        }
        
        // Fallback to login if fetch fails or no token
        setIframeUrl("http://localhost:5173/login");
      } catch (err) {
        console.error("Failed to fetch SSO token", err);
        setIframeUrl("http://localhost:5173/login");
      }
    };

    fetchSsoToken();
  }, [view]);

  return (
    <WorkspaceShell>
      <div className="flex h-[calc(100vh-140px)] w-full flex-col overflow-hidden rounded-xl border border-[#d9e2ef] bg-white shadow-sm mt-4">
        {iframeUrl ? (
          <iframe
            src={iframeUrl}
            className="h-full w-full border-none"
            title="Accountech"
            allow="fullscreen"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#6678c1] border-t-transparent" />
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
