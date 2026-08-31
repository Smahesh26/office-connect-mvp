"use client";

export interface ShippingSpecsData {
  packageWeightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  dispatchSla: string;
  isFragile: boolean;
  specifications: Array<{ key: string; value: string }>;
}

export const SectionShippingSpecs = ({
  data,
  onChange,
}: {
  data: ShippingSpecsData;
  onChange: (data: ShippingSpecsData) => void;
}) => {
  const volumetricWeightKg = Number(
    ((data.lengthCm * data.widthCm * data.heightCm) / 5000).toFixed(2)
  );

  const handleAddSpec = () => {
    onChange({
      ...data,
      specifications: [...data.specifications, { key: "", value: "" }],
    });
  };

  const handleUpdateSpec = (idx: number, field: "key" | "value", val: string) => {
    const updated = [...data.specifications];
    updated[idx][field] = val;
    onChange({ ...data, specifications: updated });
  };

  const handleRemoveSpec = (idx: number) => {
    onChange({
      ...data,
      specifications: data.specifications.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-6 text-xs select-none">
      
      {/* 7. SHIPPING INFORMATION */}
      <div className="space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
            7. Package Dimensions & Courier Shipping Telemetry
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Accurate package weight and dimensions are required for Bluedart Air automated freight billing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Dead Weight (Grams) *
            </label>
            <input
              type="number"
              value={data.packageWeightGrams}
              onChange={(e) => onChange({ ...data, packageWeightGrams: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Length (cm) *</label>
            <input
              type="number"
              value={data.lengthCm}
              onChange={(e) => onChange({ ...data, lengthCm: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Width (cm) *</label>
            <input
              type="number"
              value={data.widthCm}
              onChange={(e) => onChange({ ...data, widthCm: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Height (cm) *</label>
            <input
              type="number"
              value={data.heightCm}
              onChange={(e) => onChange({ ...data, heightCm: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded font-bold"
            />
          </div>
        </div>

        <div className="p-3 rounded bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
          <span className="text-slate-600 font-medium">
            Calculated Volumetric Weight (L×W×H / 5000):
          </span>
          <strong className="font-mono text-slate-900 font-bold">
            {volumetricWeightKg} kg (Billable: {Math.max(data.packageWeightGrams / 1000, volumetricWeightKg)} kg)
          </strong>
        </div>
      </div>

      {/* 8. PRODUCT SPECIFICATIONS MATRIX */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              8. Technical Specifications Matrix
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Structured Key-Value parameters rendered on the customer PDP specs table.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddSpec}
            className="text-xs font-bold text-[#404d85] hover:underline"
          >
            + Add Specification Row
          </button>
        </div>

        <div className="space-y-2">
          {data.specifications.map((spec, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                placeholder="Parameter (e.g. GSM Weight)"
                value={spec.key}
                onChange={(e) => handleUpdateSpec(idx, "key", e.target.value)}
                className="w-1/3 px-3 py-1.5 border border-slate-300 rounded font-bold text-slate-700"
              />
              <input
                type="text"
                placeholder="Value (e.g. 240 GSM French Terry)"
                value={spec.value}
                onChange={(e) => handleUpdateSpec(idx, "value", e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-slate-900"
              />
              <button
                type="button"
                onClick={() => handleRemoveSpec(idx)}
                className="px-2.5 text-red-600 hover:bg-red-50 rounded font-bold"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
