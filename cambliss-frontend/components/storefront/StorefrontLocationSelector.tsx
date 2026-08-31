"use client";

import { useState, useRef, useEffect } from "react";

export interface AddressOption {
  id: string;
  name: string;
  pincode: string;
  city: string;
  state: string;
  isDefault?: boolean;
}

export const StorefrontLocationSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressOption>({
    id: "addr-1",
    name: "Alex Johnson",
    pincode: "400001",
    city: "Mumbai",
    state: "Maharashtra",
    isDefault: true,
  });
  const [searchPincode, setSearchPincode] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  const sampleAddresses: AddressOption[] = [
    {
      id: "addr-1",
      name: "Alex Johnson",
      pincode: "400001",
      city: "Fort, Mumbai",
      state: "Maharashtra",
      isDefault: true,
    },
    {
      id: "addr-2",
      name: "Office Connect HQ",
      pincode: "560001",
      city: "MG Road, Bengaluru",
      state: "Karnataka",
    },
    {
      id: "addr-3",
      name: "Warehouse North",
      pincode: "110001",
      city: "Connaught Place, New Delhi",
      state: "Delhi",
    },
  ];

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (addr: AddressOption) => {
    setSelectedAddress(addr);
    setIsOpen(false);
  };

  const handleApplyPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPincode.trim()) return;
    setSelectedAddress({
      id: `custom-${Date.now()}`,
      name: "Current Location",
      pincode: searchPincode.trim(),
      city: "Delivery Region",
      state: "India",
    });
    setIsOpen(false);
    setSearchPincode("");
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] hover:bg-slate-100 border border-transparent hover:border-slate-200 transition text-left select-none group"
      >
        <span className="text-sm text-[#404d85] group-hover:scale-110 transition shrink-0">📍</span>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-slate-500 font-medium leading-none truncate">
            Deliver to
          </span>
          <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[110px] sm:max-w-[130px]">
            {selectedAddress ? `${selectedAddress.city.split(",")[0]} ${selectedAddress.pincode}` : "Select Location"}
          </span>
        </div>
        <span className="text-[9px] text-slate-400 ml-0.5">▼</span>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 sm:w-88 bg-white rounded-[8px] shadow-xl border border-slate-200 z-50 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <span>📍</span> Choose Delivery Location
            </h4>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-700 text-xs p-1"
            >
              ✕
            </button>
          </div>

          {/* Quick Pincode Input */}
          <form onSubmit={handleApplyPincode} className="space-y-2">
            <label htmlFor="pincode-input" className="text-[11px] font-semibold text-slate-600 block">
              Enter Indian Pincode
            </label>
            <div className="flex items-center gap-2">
              <input
                id="pincode-input"
                type="text"
                maxLength={6}
                value={searchPincode}
                onChange={(e) => setSearchPincode(e.target.value)}
                placeholder="e.g. 400001 or 560001"
                className="flex-1 h-9 px-3 text-xs rounded-[6px] border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#404d85] font-medium"
              />
              <button
                type="submit"
                className="h-9 px-3 rounded-[6px] bg-[#404d85] hover:bg-[#323d6a] text-white text-xs font-bold transition shadow-xs"
              >
                Apply
              </button>
            </div>
          </form>

          {/* Use Device Location Button UI */}
          <button
            type="button"
            onClick={() => {
              setSelectedAddress({
                id: "gps-1",
                name: "Current GPS Location",
                pincode: "400051",
                city: "Bandra Kurla Complex",
                state: "Maharashtra",
              });
              setIsOpen(false);
            }}
            className="w-full py-2 px-3 rounded-[6px] border border-dashed border-[#404d85]/40 hover:bg-[#404d85]/5 text-[#404d85] text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <span>🎯</span> Use Current GPS Location
          </button>

          {/* Saved Addresses Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Saved Addresses
            </span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {sampleAddresses.map((addr) => (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => handleSelect(addr)}
                  className={`w-full text-left p-2 rounded-[6px] border transition flex items-start justify-between gap-2 ${
                    selectedAddress.id === addr.id
                      ? "border-[#404d85] bg-[#404d85]/5 text-[#404d85]"
                      : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{addr.name}</span>
                      {addr.isDefault && (
                        <span className="text-[9px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-bold">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{addr.city}, {addr.pincode}</p>
                  </div>
                  {selectedAddress.id === addr.id && (
                    <span className="text-xs font-black text-[#404d85]">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
