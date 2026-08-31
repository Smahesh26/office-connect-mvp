"use client";

import { useState } from "react";

export interface DeliveryAddress {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  type: "Work / Office" | "Home" | "Warehouse";
}

export const CheckoutStep1Address = ({
  isActive,
  isCompleted,
  selectedAddress,
  onSelectAddress,
  onContinue,
  onEditStep,
  gstin,
  onGstinChange,
  companyName,
  onCompanyNameChange,
}: {
  isActive: boolean;
  isCompleted: boolean;
  selectedAddress: DeliveryAddress;
  onSelectAddress: (addr: DeliveryAddress) => void;
  onContinue: () => void;
  onEditStep: () => void;
  gstin: string;
  onGstinChange: (val: string) => void;
  companyName: string;
  onCompanyNameChange: (val: string) => void;
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [useB2BGst, setUseB2BGst] = useState(Boolean(gstin));

  const savedAddresses: DeliveryAddress[] = [
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
  ];

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

  const handleAddNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: DeliveryAddress = {
      ...newForm,
      id: `addr-${Date.now()}`,
      isDefault: false,
    };
    onSelectAddress(created);
    setShowAddForm(false);
  };

  // Completed State Preview
  if (!isActive && isCompleted) {
    return (
      <div className="p-4 rounded-[8px] border border-slate-200 bg-white flex items-start justify-between gap-4 text-xs shadow-2xs select-none">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
              ✓
            </span>
            <span className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
              1. Delivery Address Selected
            </span>
          </div>
          <p className="font-bold text-slate-800 pl-7">{selectedAddress.name}</p>
          <p className="text-slate-600 pl-7">
            {selectedAddress.line1}, {selectedAddress.city} {selectedAddress.pincode} • Phone: {selectedAddress.phone}
          </p>
          {gstin && (
            <p className="text-emerald-700 font-mono text-[11px] pl-7 font-bold">
              B2B GSTIN: {gstin} ({companyName})
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onEditStep}
          className="px-3 py-1 rounded border border-slate-200 hover:border-[#404d85] text-[#404d85] font-bold text-xs transition"
        >
          Change
        </button>
      </div>
    );
  }

  // Inactive Non-completed State
  if (!isActive) {
    return (
      <div className="p-4 rounded-[8px] border border-slate-200 bg-slate-50 opacity-60 text-xs flex items-center gap-2 select-none">
        <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 font-bold text-[10px] flex items-center justify-center">
          1
        </span>
        <span className="font-bold text-slate-600 uppercase tracking-wider text-[11px]">
          1. Delivery Address & GST Information
        </span>
      </div>
    );
  }

  // Active Expanded State
  return (
    <div className="p-5 sm:p-6 rounded-[8px] border border-[#404d85] bg-white space-y-5 shadow-2xs select-none ring-2 ring-[#404d85]/10">
      
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#404d85] text-white font-black text-xs flex items-center justify-center">
            1
          </span>
          <h2 className="font-black text-sm text-slate-900 uppercase tracking-wider">
            Select Delivery Address
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs font-bold text-[#404d85] hover:underline"
        >
          {showAddForm ? "Cancel" : "+ Add New Address"}
        </button>
      </div>

      {/* Saved Addresses List */}
      {!showAddForm && (
        <div className="space-y-3">
          {savedAddresses.map((addr) => {
            const isSelected = selectedAddress.id === addr.id;
            return (
              <label
                key={addr.id}
                onClick={() => onSelectAddress(addr)}
                className={`p-4 rounded-[6px] border flex items-start gap-3 cursor-pointer transition text-xs ${
                  isSelected
                    ? "border-[#404d85] bg-[#404d85]/5 ring-1 ring-[#404d85]"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="checkoutAddress"
                  checked={isSelected}
                  onChange={() => onSelectAddress(addr)}
                  className="mt-0.5 text-[#404d85] focus:ring-[#404d85]"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{addr.name}</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-extrabold text-[9px] uppercase">
                      {addr.type}
                    </span>
                    {addr.isDefault && (
                      <span className="text-emerald-700 font-bold text-[10px]">Default</span>
                    )}
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {addr.line1}, {addr.line2 ? `${addr.line2}, ` : ""}{addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                  </p>
                  <p className="text-slate-500 font-medium">Mobile: {addr.phone}</p>
                </div>
              </label>
            );
          })}
        </div>
      )}

      {/* Add New Address Form Modal/Inline */}
      {showAddForm && (
        <form onSubmit={handleAddNewSubmit} className="p-4 rounded bg-slate-50 border border-slate-200 space-y-3 text-xs">
          <h4 className="font-bold text-slate-900">Add New Delivery Location</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Contact Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bhasker A."
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">10-Digit Mobile Phone *</label>
              <input
                type="tel"
                required
                placeholder="e.g. +91 98450 12345"
                value={newForm.phone}
                onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Address Line 1 (Flat, Building, Street) *</label>
            <input
              type="text"
              required
              placeholder="e.g. Suite 402, Prestige Tech Park"
              value={newForm.line1}
              onChange={(e) => setNewForm({ ...newForm, line1: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">6-Digit PIN Code *</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="560103"
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
              className="flex-1 py-1.5 bg-slate-200 text-slate-700 font-bold rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-1.5 bg-[#404d85] text-white font-bold rounded"
            >
              Save & Use Address
            </button>
          </div>
        </form>
      )}

      {/* B2B GSTIN Tax Invoice Option */}
      <div className="p-4 rounded-[6px] bg-slate-50 border border-slate-200 space-y-3 text-xs">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useB2BGst}
            onChange={(e) => setUseB2BGst(e.target.checked)}
            className="rounded border-slate-300 text-[#404d85] focus:ring-[#404d85]"
          />
          <span className="font-bold text-slate-900">
            🏢 Use B2B GSTIN for 18% Input Tax Credit Invoice
          </span>
        </label>

        {useB2BGst && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="font-bold text-slate-700 block mb-1">15-Digit GSTIN *</label>
              <input
                type="text"
                maxLength={15}
                placeholder="29AABCU9603R1ZM"
                value={gstin}
                onChange={(e) => onGstinChange(e.target.value.toUpperCase())}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold uppercase"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Registered Company Name *</label>
              <input
                type="text"
                placeholder="Cambliss Studio Private Limited"
                value={companyName}
                onChange={(e) => onCompanyNameChange(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Step Continue Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onContinue}
          className="px-6 py-2.5 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-black text-xs transition shadow-2xs"
        >
          Deliver to this Address →
        </button>
      </div>

    </div>
  );
};
