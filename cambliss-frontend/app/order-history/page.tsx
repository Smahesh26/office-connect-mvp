"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WorkspaceShell from "../../components/WorkspaceShell";

type OrderHistoryItem = {
  id: string;
  amount: string | number;
  currency: string;
  provider: string | null;
  externalPaymentId: string | null;
  paidAt: string;
  subscription: {
    status: string;
    plan: {
      name: string;
      interval: string;
    };
    organization: {
      name: string;
      supportEmail: string | null;
      users?: Array<{
        firstName: string | null;
        lastName: string | null;
        email: string;
      }>;
    };
  };
};

const getRoleFromToken = (token?: string | null): string | null => {
  if (!token) return null;
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
};

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const role = getRoleFromToken(token);
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      router.replace("/admin-order-history");
      return;
    }

    const fetchHistory = async () => {
      if (!token) {
        setLoading(false);
        setMessage("Please login first.");
        return;
      }

      try {
        const response = await fetch("/api/subscription/order-history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const raw = await response.text();
          let info: { message?: string } | null = null;
          try {
            info = raw ? JSON.parse(raw) as { message?: string } : null;
          } catch {
            info = null;
          }
          setMessage(info?.message || "Unable to load order history.");
          setOrders([]);
          return;
        }

        const data = await response.json() as OrderHistoryItem[];
        setOrders(Array.isArray(data) ? data : []);
      } catch {
        setOrders([]);
        setMessage("Unable to load order history.");
      } finally {
        setLoading(false);
      }
    };

    void fetchHistory();
  }, [router]);

  const downloadInvoice = async (paymentId: string) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const response = await fetch(`/api/subscription/order-history/${paymentId}/invoice`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      setMessage("Unable to download invoice.");
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `officeconnect-invoice-${paymentId}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <WorkspaceShell>
      <div className="relative mt-5 overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-6 shadow-[0_24px_56px_-30px_rgba(0,0,0,0.85)] ring-1 ring-white/80">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-zinc-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-white/70 blur-3xl" />
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Order History</h1>
        <p className="mt-1 text-sm text-zinc-600">View your payments, client details, and download invoices.</p>

        {message && <p className="mt-4 rounded-xl border border-zinc-200 bg-white/90 px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm">{message}</p>}
        {loading ? (
          <p className="mt-4 rounded-xl border border-zinc-200 bg-white/90 px-3 py-2 text-sm text-zinc-500 shadow-sm">Loading order history...</p>
        ) : orders.length === 0 ? (
          <p className="mt-4 rounded-xl border border-zinc-200 bg-white/90 px-3 py-2 text-sm text-zinc-500 shadow-sm">No orders found.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((order) => {
              const user = order.subscription.organization.users?.[0];
              const clientName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "N/A";
              const clientEmail = user?.email || order.subscription.organization.supportEmail || "N/A";

              return (
                <div key={order.id} className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-4 shadow-[0_18px_42px_-24px_rgba(0,0,0,0.5)] ring-1 ring-white/80 transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-zinc-200/55 blur-2xl" />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold tracking-tight text-zinc-900">{order.subscription.plan.name} · {order.subscription.plan.interval}</p>
                      <p className="text-xs text-zinc-500">Payment ID: {order.id}</p>
                      <p className="mt-1 text-xs text-zinc-600">Client: {clientName} · {clientEmail}</p>
                      <p className="text-xs text-zinc-600">Organization: {order.subscription.organization.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-zinc-900">{order.currency} {order.amount}</p>
                      <p className="text-xs text-zinc-500">{new Date(order.paidAt).toLocaleString()}</p>
                      <button
                        onClick={() => void downloadInvoice(order.id)}
                        className="mt-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_12px_24px_-16px_rgba(0,0,0,0.9)] transition hover:-translate-y-0.5 hover:bg-zinc-800"
                      >
                        Download Invoice
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
