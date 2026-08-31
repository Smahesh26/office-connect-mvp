"use client";

import { useState } from "react";
import { DeliveryAddress } from "@/components/checkout/CheckoutStep1Address";

export const AccountAddressesManager = () => {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([
    {
      id: "addr-1",
      name: "Cambliss Studio & Tech HQ (Bhasker A.)",
      phone: "+91 98450 12345",
      line1: "Suite 402, Prestige Tech Park, Marathahalli-Sarjapur Outer Ring Rd",
      line2: "Kadubeesanahalli",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560103",
      isDefault: true,
      type: "Work / Office",
    },
    {
      id: "addr-2",
      name: "Cambliss Logistics Warehouse Hub",
      phone: "+91 98450 67890",
      line1: "Plot 14-B, Electronic City Phase 1",
      line2: "Near Infosys Gate 2",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560100",
      isDefault: false,
      type: "Warehouse",
    },
    {
      id: "addr-3",
      name: "Bhasker A. (Residence)",
      phone: "+91 98450 12345",
      line1: "Villa 18, Palm Meadows, Whitefield",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560066",
      isDefault: false,
      type: "Home",
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newForm, setNewForm] = useState<Omit<DeliveryAddress, "id" | "isDefault">>({
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "",
    type: "Work / Office",
  });

  const handleSetDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === id }))
    );
  };

  const handleDelete = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: DeliveryAddress = {
      ...newForm,
      id: `addr-${Date.now()}`,
      isDefault: addresses.length === 0,
    };
    setAddresses((prev) => [...prev, created]);
    setShowAddForm(false);
  };

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs select-none">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
            Saved Delivery Addresses ({addresses.length})
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Manage business locations, warehouses, and billing destinations
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3.5 py-1.5 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs transition self-start sm:self-auto"
        >
          {showAddForm ? "Cancel" : "+ Add New Address"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="p-4 rounded-[6px] bg-slate-50 border border-slate-200 space-y-3 text-xs">
          <h4 className="font-bold text-slate-900">Add New Address Location</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Contact Name *</label>
              <input
                type="text"
                required
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={newForm.phone}
                onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Address Line 1 *</label>
            <input
              type="text"
              required
              value={newForm.line1}
              onChange={(e) => setNewForm({ ...newForm, line1: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">PIN Code *</label>
              <input
                type="text"
                required
                maxLength={6}
                value={newForm.pincode}
                onChange={(e) => setNewForm({ ...newForm, pincode: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">City *</label>
              <input
                type="text"
                required
                value={newForm.city}
                onChange={(e) => setNewForm({ ...newForm, city: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">State *</label>
              <input
                type="text"
                required
                value={newForm.state}
                onChange={(e) => setNewForm({ ...newForm, state: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>
          </div>
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-1.5 bg-slate-200 text-slate-700 font-bold rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#404d85] text-white font-bold rounded"
            >
              Save Address
            </button>
          </div>
        </form>
      )}

      {/* Addresses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`p-4 rounded-[6px] border space-y-2 text-xs flex flex-col justify-between ${
              addr.isDefault
                ? "border-[#404d85] bg-[#404d85]/5 ring-1 ring-[#404d85]/40"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{addr.name}</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[9px] uppercase text-slate-600">
                  {addr.type}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {addr.line1}, {addr.line2 ? `${addr.line2}, ` : ""}{addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
              </p>
              <p className="text-slate-500 font-medium">Phone: {addr.phone}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {addr.isDefault ? (
                <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                  ✓ Default Address
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetDefault(addr.id)}
                  className="font-bold text-[#404d85] hover:underline text-[11px]"
                >
                  Set as Default
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDelete(addr.id)}
                className="text-red-600 hover:text-red-700 font-bold text-[11px]"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
