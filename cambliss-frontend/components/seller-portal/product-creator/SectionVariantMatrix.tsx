"use client";

import { formatINR } from "@/components/commerce/CommercePrimitives";

export interface VariantSkuItem {
  id: string;
  color: string;
  size: string;
  sku: string;
  price: number;
  stock: number;
  barcode: string;
  active: boolean;
}

export interface VariantData {
  hasVariants: boolean;
  colors: string[];
  sizes: string[];
  matrix: VariantSkuItem[];
}

export const SectionVariantMatrix = ({
  data,
  onChange,
  basePrice = 1499,
}: {
  data: VariantData;
  onChange: (data: VariantData) => void;
  basePrice?: number;
}) => {
  // Regenerate matrix whenever colors or sizes change
  const regenerateMatrix = (newColors: string[], newSizes: string[]) => {
    const newMatrix: VariantSkuItem[] = [];
    newColors.forEach((color) => {
      newSizes.forEach((size) => {
        const colorCode = color.substring(0, 3).toUpperCase();
        const existing = data.matrix.find(
          (m) => m.color === color && m.size === size
        );

        newMatrix.push(
          existing || {
            id: `var-${color.toLowerCase()}-${size.toLowerCase()}`,
            color,
            size,
            sku: `UT-TSHIRT-${colorCode}-${size}`,
            price: basePrice,
            stock: 25,
            barcode: `8901248${Math.floor(100000 + Math.random() * 900000)}`,
            active: true,
          }
        );
      });
    });

    onChange({
      ...data,
      colors: newColors,
      sizes: newSizes,
      matrix: newMatrix,
    });
  };

  const handleUpdateSkuItem = (id: string, field: keyof VariantSkuItem, value: any) => {
    const updated = data.matrix.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    onChange({ ...data, matrix: updated });
  };

  const availableColors = ["Black", "White", "Blue", "Charcoal Gray", "Sage Green"];
  const availableSizes = ["S", "M", "L", "XL", "XXL"];

  const toggleColor = (c: string) => {
    const nextColors = data.colors.includes(c)
      ? data.colors.filter((x) => x !== c)
      : [...data.colors, c];
    if (nextColors.length > 0) regenerateMatrix(nextColors, data.sizes);
  };

  const toggleSize = (s: string) => {
    const nextSizes = data.sizes.includes(s)
      ? data.sizes.filter((x) => x !== s)
      : [...data.sizes, s];
    if (nextSizes.length > 0) regenerateMatrix(data.colors, nextSizes);
  };

  return (
    <div className="space-y-6 text-xs select-none">
      
      <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
            4. Multi-Axis Variant Matrix Generator
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Configure Color & Size variation axes to generate individual inventory SKUs.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded bg-[#404d85]/10 text-[#404d85] font-black text-xs">
          {data.matrix.length} Generated SKUs ({data.colors.length} Colors × {data.sizes.length} Sizes)
        </span>
      </div>

      {/* Axis 1: Colors Selection */}
      <div className="p-4 rounded-[6px] bg-slate-50 border border-slate-200 space-y-2">
        <label className="font-bold text-slate-800 block text-xs">
          Axis 1: Available Colors ({data.colors.join(", ")})
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {availableColors.map((c) => {
            const isSelected = data.colors.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleColor(c)}
                className={`px-3 py-1.5 rounded-[4px] font-bold text-xs transition border flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#404d85] text-white border-[#404d85] shadow-2xs"
                    : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/20"
                  style={{
                    backgroundColor:
                      c === "Black" ? "#18181b" : c === "White" ? "#ffffff" : c === "Blue" ? "#2563eb" : "#71717a",
                  }}
                />
                <span>{c}</span>
                {isSelected && <span>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Axis 2: Sizes Selection */}
      <div className="p-4 rounded-[6px] bg-slate-50 border border-slate-200 space-y-2">
        <label className="font-bold text-slate-800 block text-xs">
          Axis 2: Available Sizes ({data.sizes.join(", ")})
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {availableSizes.map((s) => {
            const isSelected = data.sizes.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSize(s)}
                className={`w-10 h-8 rounded-[4px] font-black text-xs transition border flex items-center justify-center ${
                  isSelected
                    ? "bg-[#404d85] text-white border-[#404d85] shadow-2xs"
                    : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Generated 2D Cartesian SKU Matrix Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
            Generated Variant SKU Matrix & Stock Allocation
          </h4>
          <span className="text-slate-400 text-[11px]">Independent price & inventory per variant</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-[6px]">
          <table className="w-full text-left text-xs bg-white">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold text-[10px] uppercase">
                <th className="p-2.5">Variant</th>
                <th className="p-2.5">SKU Code</th>
                <th className="p-2.5 text-right">Price (₹)</th>
                <th className="p-2.5 text-right">Stock (Units)</th>
                <th className="p-2.5">EAN / Barcode</th>
                <th className="p-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {data.matrix.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60">
                  <td className="p-2.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/20"
                        style={{
                          backgroundColor:
                            row.color === "Black" ? "#18181b" : row.color === "White" ? "#ffffff" : "#2563eb",
                        }}
                      />
                      <strong className="text-slate-900">{row.color}</strong>
                      <span className="text-slate-400">/</span>
                      <span className="font-bold text-[#404d85]">{row.size}</span>
                    </div>
                  </td>
                  <td className="p-2.5 font-mono text-[11px] font-bold text-slate-800">
                    <input
                      type="text"
                      value={row.sku}
                      onChange={(e) => handleUpdateSkuItem(row.id, "sku", e.target.value)}
                      className="px-2 py-1 border border-slate-300 rounded font-mono font-bold w-36 uppercase"
                    />
                  </td>
                  <td className="p-2.5 text-right">
                    <input
                      type="number"
                      value={row.price}
                      onChange={(e) => handleUpdateSkuItem(row.id, "price", Number(e.target.value))}
                      className="px-2 py-1 border border-slate-300 rounded font-bold w-20 text-right text-slate-900"
                    />
                  </td>
                  <td className="p-2.5 text-right">
                    <input
                      type="number"
                      value={row.stock}
                      onChange={(e) => handleUpdateSkuItem(row.id, "stock", Number(e.target.value))}
                      className="px-2 py-1 border border-slate-300 rounded font-bold w-16 text-right text-slate-800"
                    />
                  </td>
                  <td className="p-2.5 font-mono text-[10px] text-slate-400">
                    {row.barcode}
                  </td>
                  <td className="p-2.5 text-center">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-[9px] uppercase">
                      Active
                    </span>
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
