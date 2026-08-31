"use client";

import { useState } from "react";

export interface DeliveryAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
  gstin?: string;
}

export const CheckoutStepAddress = ({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddNewAddress,
}: {
  addresses: DeliveryAddress[];
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
  onAddNewAddress: (addr: Omit<DeliveryAddress, "id">) => void;
}) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560001",
    gstin: "",
  });

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    onAddNewAddress(formData);
    setShowNewModal(false);
  };

  return (
    <div className="space-y-6 select-none">
      
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-slate-900">
          1. Select Delivery & Tax Invoice Address
        </h2>
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="text-xs font-bold text-[#404d85] hover:underline"
        >
          + Add New Address
        </button>
      </div>

      {/* Saved Addresses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => {
          const isSelected = selectedAddressId === addr.id;
          return (
            <div
              key={addr.id}
              onClick={() => onSelectAddress(addr.id)}
              className={`p-4 rounded-[8px] border-2 cursor-pointer transition flex flex-col justify-between space-y-3 ${
                isSelected
                  ? "border-[#404d85] bg-blue-50/30 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">{addr.fullName}</span>
                  {addr.isDefault && (
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.2 rounded">
                      Default
                    </span>
                  )}
                </div>

                <p className="text-slate-600 leading-relaxed">
                  {addr.addressLine1} {addr.addressLine2 && `, ${addr.addressLine2}`}
                  <br />
                  {addr.city}, {addr.state} - <span className="font-mono font-bold">{addr.pincode}</span>
                </p>

                <p className="text-slate-500 font-medium">📞 Phone: {addr.phone}</p>
                {addr.gstin && (
                  <p className="text-slate-500 font-mono text-[11px]">🧾 GSTIN: {addr.gstin}</p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span className={isSelected ? "text-[#404d85]" : "text-slate-400"}>
                  {isSelected ? "● Deliver to this address" : "○ Select"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal to Add New Address */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[10px] max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900">Add New Delivery Address</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmitNew} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name / Business Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">10-Digit Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Address (House / Street) *</label>
                <input
                  type="text"
                  required
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">GSTIN (Optional for B2B Input Tax Credit)</label>
                <input
                  type="text"
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] font-mono"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#404d85] text-white font-bold rounded"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
