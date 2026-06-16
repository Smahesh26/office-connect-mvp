"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type StorefrontListing = {
  id: string;
  sellingPrice: number;
  description?: string | null;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  category?: {
    id: string;
    name: string;
  } | null;
};

type StorefrontData = {
  id: string;
  name: string;
  domain: string;
  description?: string | null;
  paymentDisplayName?: string | null;
  paymentUpiId?: string | null;
  paymentBankAccountName?: string | null;
  paymentBankAccountNo?: string | null;
  paymentBankIfsc?: string | null;
  paymentInstructions?: string | null;
  productListings: StorefrontListing[];
};

type CartItem = {
  listingId: string;
  quantity: number;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export default function StorefrontPage() {
  const params = useParams<{ domain: string }>();
  const domain = typeof params?.domain === "string" ? params.domain : "";

  const [store, setStore] = useState<StorefrontData | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [customer, setCustomer] = useState({ firstName: "", lastName: "", email: "", phone: "" });

  useEffect(() => {
    const loadStorefront = async () => {
      if (!domain) {
        setError("Store domain is missing");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/ecommerce/public/stores/${encodeURIComponent(domain)}`);
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(payload?.message ?? "Failed to load store");
        }

        const payload = (await response.json()) as StorefrontData;
        setStore(payload);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load store");
      } finally {
        setLoading(false);
      }
    };

    void loadStorefront();
  }, [domain]);

  const cartItems = useMemo<CartItem[]>(() => {
    return Object.entries(cart)
      .filter(([, quantity]) => Number.isFinite(quantity) && quantity > 0)
      .map(([listingId, quantity]) => ({ listingId, quantity }));
  }, [cart]);

  const total = useMemo(() => {
    if (!store) {
      return 0;
    }

    const listingMap = new Map(store.productListings.map((listing) => [listing.id, listing]));
    return cartItems.reduce((sum, item) => {
      const listing = listingMap.get(item.listingId);
      if (!listing) {
        return sum;
      }
      return sum + Number(listing.sellingPrice) * item.quantity;
    }, 0);
  }, [store, cartItems]);

  const placeOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (!domain) {
      setError("Store domain is missing");
      return;
    }
    if (!customer.firstName.trim()) {
      setError("First name is required");
      return;
    }
    if (cartItems.length === 0) {
      setError("Please add at least one product");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/ecommerce/public/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain,
          customer: {
            firstName: customer.firstName.trim(),
            lastName: customer.lastName.trim() || undefined,
            email: customer.email.trim() || undefined,
            phone: customer.phone.trim() || undefined,
          },
          items: cartItems,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Failed to place order");
      }

      const payload = (await response.json()) as { id: string };
      setSuccess(`Order placed successfully. Order ID: ${payload.id}`);
      setCart({});
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to place order");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-zinc-600">Loading store...</div>;
  }

  if (!store) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-red-600">{error || "Store not found"}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Storefront</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{store.name}</h1>
          <p className="mt-2 text-sm text-zinc-600">{store.description || "Welcome to our online store."}</p>
          <p className="mt-2 text-xs text-zinc-500">Domain: {store.domain}</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-zinc-900">Products</h2>
            {store.productListings.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">No products listed yet.</p>
            ) : (
              <div className="mt-4 grid gap-3">
                {store.productListings.map((listing) => (
                  <div key={listing.id} className="rounded-xl border border-zinc-200 p-3">
                    <p className="font-medium text-zinc-900">{listing.product.name}</p>
                    <p className="text-xs text-zinc-500">SKU: {listing.product.sku}</p>
                    <p className="text-xs text-zinc-500">Category: {listing.category?.name || "Uncategorized"}</p>
                    <p className="mt-1 font-semibold text-zinc-900">{formatMoney(Number(listing.sellingPrice))}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={cart[listing.id] ?? 0}
                        onChange={(event) => {
                          const nextValue = Number(event.target.value);
                          setCart((prev) => ({
                            ...prev,
                            [listing.id]: Number.isFinite(nextValue) && nextValue >= 0 ? nextValue : 0,
                          }));
                        }}
                        className="w-24 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                      />
                      <span className="text-xs text-zinc-500">Quantity</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <section className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-zinc-900">Checkout</h2>
              <p className="mt-1 text-sm text-zinc-600">Total: {formatMoney(total)}</p>
              <form className="mt-4 space-y-3" onSubmit={placeOrder}>
                <input
                  value={customer.firstName}
                  onChange={(event) => setCustomer((prev) => ({ ...prev, firstName: event.target.value }))}
                  placeholder="First name"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  value={customer.lastName}
                  onChange={(event) => setCustomer((prev) => ({ ...prev, lastName: event.target.value }))}
                  placeholder="Last name"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  value={customer.email}
                  onChange={(event) => setCustomer((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="Email"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  value={customer.phone}
                  onChange={(event) => setCustomer((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="Phone"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? "Placing order..." : "Place Order"}
                </button>
              </form>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              {success && <p className="mt-3 text-sm text-emerald-700">{success}</p>}
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-zinc-900">Payment Details</h3>
              <p className="mt-1 text-xs text-zinc-600">{store.paymentDisplayName || store.name}</p>
              {store.paymentUpiId && <p className="mt-2 text-sm text-zinc-700">UPI: {store.paymentUpiId}</p>}
              {store.paymentBankAccountName && (
                <p className="mt-1 text-sm text-zinc-700">A/C Name: {store.paymentBankAccountName}</p>
              )}
              {store.paymentBankAccountNo && (
                <p className="mt-1 text-sm text-zinc-700">A/C No: {store.paymentBankAccountNo}</p>
              )}
              {store.paymentBankIfsc && <p className="mt-1 text-sm text-zinc-700">IFSC: {store.paymentBankIfsc}</p>}
              {store.paymentInstructions && (
                <p className="mt-2 text-xs text-zinc-600">{store.paymentInstructions}</p>
              )}
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}
