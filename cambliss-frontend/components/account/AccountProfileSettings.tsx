"use client";

import { useState } from "react";

export const AccountProfileSettings = () => {
  const [profile, setProfile] = useState({
    fullName: "Bhasker Anand",
    email: "bhaskeradv1@gmail.com",
    phone: "+91 98450 12345",
    companyName: "Cambliss Studio Private Limited",
    gstin: "29AABCU9603R1ZM",
    pan: "AABCU9603R",
    designation: "Chief Executive Officer / Procurement Lead",
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs select-none">
      
      <div className="pb-4 border-b border-slate-100">
        <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
          Profile & Organization Credentials
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          Manage your verified buyer identity and B2B corporate billing profiles
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5 text-xs">
        
        {/* Personal Details */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
            1. Personal & Contact Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Legal Name</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Registered Email Address</label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-50 text-slate-500 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mobile Phone (OTP Verified)</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Designation / Role</label>
              <input
                type="text"
                value={profile.designation}
                onChange={(e) => setProfile({ ...profile, designation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
              />
            </div>
          </div>
        </div>

        {/* Corporate B2B Tax Profile */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
            2. Corporate B2B Tax & Billing Profile
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Registered Entity Name</label>
              <input
                type="text"
                value={profile.companyName}
                onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Company PAN</label>
              <input
                type="text"
                value={profile.pan}
                onChange={(e) => setProfile({ ...profile, pan: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-mono font-bold uppercase"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="font-bold text-slate-700 block mb-1">15-Digit GSTIN (Tax Invoice Eligible)</label>
              <input
                type="text"
                value={profile.gstin}
                onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-mono font-bold uppercase"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-3 flex items-center justify-between">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-black text-xs transition shadow-2xs"
          >
            Save Profile Changes
          </button>

          {isSaved && (
            <span className="text-emerald-700 font-bold text-xs">
              ✓ Profile settings updated successfully!
            </span>
          )}
        </div>

      </form>

    </div>
  );
};
