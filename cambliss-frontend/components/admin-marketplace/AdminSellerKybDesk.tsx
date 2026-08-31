"use client";

export interface SellerKybApplication {
  id: string;
  businessName: string;
  tradeName: string;
  category: string;
  gstin: string;
  pan: string;
  bankName: string;
  accountNumber: string;
  warehouseCity: string;
  appliedDate: string;
  status: "Pending Review" | "Approved" | "Rejected";
}

export const AdminSellerKybDesk = ({
  applications,
  onApprove,
  onReject,
}: {
  applications: SellerKybApplication[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) => {
  return (
    <div className="space-y-4 select-none">
      
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900">
            3P Merchant KYB & GST Verification Queue
          </h3>
          <p className="text-xs text-slate-500">
            Review legal business entities, GSTIN certificates, and escrow settlement bank accounts before marketplace activation.
          </p>
        </div>
      </div>

      <div className="border border-slate-200 rounded-[8px] overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Merchant Entity & Trade Name</th>
                <th className="py-3 px-4">GSTIN & PAN</th>
                <th className="py-3 px-4">Escrow Settlement Bank</th>
                <th className="py-3 px-4">Warehouse Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">KYB Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/70 transition">
                  
                  {/* Entity & Name */}
                  <td className="py-3 px-4 space-y-0.5">
                    <span className="font-bold text-slate-900 block">{app.businessName}</span>
                    <span className="text-[11px] text-[#404d85] font-semibold">Store: {app.tradeName}</span>
                    <span className="text-[10px] text-slate-400 block">Applied on {app.appliedDate}</span>
                  </td>

                  {/* GSTIN / PAN */}
                  <td className="py-3 px-4 space-y-0.5 font-mono text-[11px]">
                    <span className="font-bold text-slate-800 block">GST: {app.gstin}</span>
                    <span className="text-slate-500">PAN: {app.pan}</span>
                  </td>

                  {/* Bank */}
                  <td className="py-3 px-4 space-y-0.5">
                    <span className="font-semibold text-slate-800 block">{app.bankName}</span>
                    <span className="text-[11px] font-mono text-slate-400">A/C: {app.accountNumber}</span>
                  </td>

                  {/* Location */}
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    📍 {app.warehouseCity}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                        app.status === "Approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : app.status === "Rejected"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      ● {app.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    {app.status === "Pending Review" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onApprove(app.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition shadow-2xs"
                        >
                          ✓ Approve Seller
                        </button>
                        <button
                          type="button"
                          onClick={() => onReject(app.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 text-red-600 font-bold text-xs rounded transition"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-semibold">Processed</span>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
