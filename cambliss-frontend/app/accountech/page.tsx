"use client";

import { useEffect, useState, Suspense } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";
import { useSearchParams } from "next/navigation";

function AccountechContent() {
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "";

  useEffect(() => {
    const fetchSsoToken = async () => {
      try {
        const response = await fetch('/api/auth/sso-token', {
          credentials: "include", 
        });

        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            setIframeUrl(`http://localhost:5173/sso?token=${data.token}&embedded=true&returnTo=/${view}`);
            return;
          }
        }
        
        setIframeUrl("http://localhost:5173/login");
      } catch (err) {
        console.error("Failed to fetch SSO token", err);
        setIframeUrl("http://localhost:5173/login");
      }
    };

    fetchSsoToken();
  }, [view]);

  return (
    <div className="mt-4 flex h-[calc(100vh-140px)] w-full flex-col overflow-hidden rounded-xl border border-[#d9e2ef] bg-white shadow-sm">
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
  );
}

export default function AccountechEmbedded() {
  return (
    <WorkspaceShell>
      <Suspense
        fallback={
          <div className="mt-4 flex h-[calc(100vh-140px)] w-full flex-col overflow-hidden rounded-xl border border-[#d9e2ef] bg-white shadow-sm">
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#6678c1] border-t-transparent" />
            </div>
          </div>
        }
      >
        <AccountechContent />
      </Suspense>
    </WorkspaceShell>
  );
}
