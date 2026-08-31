"use client";

import { useState } from "react";

export interface CategoryCommissionRule {
  category: string;
  defaultTakeRatePct: number;
  fixedFulfillmentFee: number;
  escrowPayoutHoldDays: number;
  isActive: boolean;
}

export const AdminCommissionEngine = ({
  rules,
  onSaveRule,
}: {
  rules: CategoryCommissionRule[];
  onSaveRule: (category: string, newRate: number, holdDays: number) => void;
}) => {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempRate, setTempRate] = useState<number>(8.5);
  const [tempHold, setTempHold] = useState<number>(2);

  const handleStartEdit = (r: CategoryCommissionRule) => {
    setEditingCategory(r.category);
    setTempRate(r.defaultTakeRatePct);
    setTempHold(r.escrowPayoutHoldDays);
  };

  const handleSave = (cat: string) => {
    onSaveRule(cat, tempRate, tempHold);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-4 select-none">
      
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900">
            Marketplace Commission & Escrow Settlement Engine
          </h3>
          <p className="text-xs text-slate-500">
            Configure category-level take-rate percentages and automated escrow release timelines (T+Days).
          </p>
        </div>
      </div>

      <div className="border border-slate-200 rounded-[8px] overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Marketplace Department</th>
                <th className="py-3 px-4">Platform Take-Rate (%)</th>
                <th className="py-3 px-4">Fixed Gateway Fee</th>
                <th className="py-3 px-4">Escrow Release SLA</th>
                <th className="py-3 px-4">Rule Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {rules.map((r) => {
                const isEditing = editingCategory === r.category;
                return (
                  <tr key={r.category} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {r.category}
                    </td>

                    <td className="py-3 px-4">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={tempRate}
                            onChange={(e) => setTempRate(Number(e.target.value))}
                            className="w-16 px-2 py-1 border border-[#404d85] rounded text-xs font-bold"
                          />
                          <span className="font-bold">%</span>
                        </div>
                      ) : (
                        <span className="font-black text-sm text-[#404d85]">{r.defaultTakeRatePct}%</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      ₹{r.fixedFulfillmentFee} / Order
                    </td>

                    <td className="py-3 px-4">
                      {isEditing ? (
                        <select
                          value={tempHold}
                          onChange={(e) => setTempHold(Number(e.target.value))}
                          className="px-2 py-1 border border-[#404d85] rounded text-xs font-bold bg-white"
                        >
                          <option value={1}>T+1 Day (Instant)</option>
                          <option value={2}>T+2 Days (Standard)</option>
                          <option value={7}>T+7 Days (High Risk)</option>
                        </select>
                      ) : (
                        <span className="font-bold text-slate-800">T+{r.escrowPayoutHoldDays} Days Post-Delivery</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded">
                        ACTIVE RULE
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSave(r.category)}
                            className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded text-xs"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategory(null)}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(r)}
                          className="px-3 py-1 border border-slate-200 hover:border-slate-300 rounded font-bold text-xs text-slate-700 transition"
                        >
                          Edit Rate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
