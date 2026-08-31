"use client";

export interface CategoryData {
  primaryCategory: string;
  subcategory: string;
  itemType: string;
  attributes: Record<string, string>;
}

export const SectionCategory = ({
  data,
  onChange,
}: {
  data: CategoryData;
  onChange: (data: CategoryData) => void;
}) => {
  const handleAttrChange = (key: string, val: string) => {
    onChange({
      ...data,
      attributes: {
        ...data.attributes,
        [key]: val,
      },
    });
  };

  return (
    <div className="space-y-6 text-xs select-none">
      
      <div className="pb-3 border-b border-slate-100">
        <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
          2. Category Taxonomy & Specific Attributes
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          Categorize your listing into the marketplace tree to unlock faceted search filters.
        </p>
      </div>

      {/* 3-Level Taxonomy Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="font-bold text-slate-700 block mb-1">
            Primary Department *
          </label>
          <select
            value={data.primaryCategory}
            onChange={(e) => onChange({ ...data, primaryCategory: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded font-bold bg-white"
          >
            <option value="Apparel & Fashion">👕 Apparel & Fashion</option>
            <option value="Electronics & Audio">⚡ Electronics & Audio</option>
            <option value="Enterprise Computing">💻 Enterprise Computing</option>
            <option value="Skincare & Beauty">🌸 Skincare & Beauty</option>
            <option value="Automotive">🚘 Auto Motors & Spares</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            Subcategory *
          </label>
          <select
            value={data.subcategory}
            onChange={(e) => onChange({ ...data, subcategory: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded font-bold bg-white"
          >
            <option value="Men's Clothing">Men&apos;s Clothing</option>
            <option value="Women's Clothing">Women&apos;s Clothing</option>
            <option value="Audio Equipment">Audio Equipment</option>
            <option value="Computer Peripherals">Computer Peripherals</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            Item Classification Type *
          </label>
          <select
            value={data.itemType}
            onChange={(e) => onChange({ ...data, itemType: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded font-bold bg-white text-[#404d85]"
          >
            <option value="T-Shirts & Polos">T-Shirts & Polos</option>
            <option value="Hoodies & Sweatshirts">Hoodies & Sweatshirts</option>
            <option value="Over-Ear Headphones">Over-Ear Headphones</option>
            <option value="Mechanical Keyboards">Mechanical Keyboards</option>
          </select>
        </div>
      </div>

      {/* Dynamic Category Attributes */}
      <div className="p-4 rounded-[6px] bg-slate-50 border border-slate-200 space-y-4">
        <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
          Mandatory Category Attributes (T-Shirts)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Fabric Composition *</label>
            <input
              type="text"
              value={data.attributes.fabric || "100% Super-Combed Organic Cotton"}
              onChange={(e) => handleAttrChange("fabric", e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Fit Type *</label>
            <select
              value={data.attributes.fit || "Relaxed Oversized"}
              onChange={(e) => handleAttrChange("fit", e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-bold"
            >
              <option value="Relaxed Oversized">Relaxed Oversized</option>
              <option value="Regular Fit">Regular Fit</option>
              <option value="Slim Fit">Slim Fit</option>
              <option value="Boxy Drop-Shoulder">Boxy Drop-Shoulder</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Neckline Style *</label>
            <select
              value={data.attributes.neck || "Ribbed Crew Neck"}
              onChange={(e) => handleAttrChange("neck", e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-bold"
            >
              <option value="Ribbed Crew Neck">Ribbed Crew Neck (2.5cm Thick Rib)</option>
              <option value="V-Neck">V-Neck</option>
              <option value="Polo Collar">Polo Collar</option>
              <option value="Mock Neck">Mock Neck</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Sleeve Length *</label>
            <select
              value={data.attributes.sleeve || "Half Sleeve"}
              onChange={(e) => handleAttrChange("sleeve", e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-bold"
            >
              <option value="Half Sleeve">Half Sleeve (Drop Shoulder)</option>
              <option value="Full Sleeve">Full Sleeve</option>
              <option value="Sleeveless">Sleeveless</option>
            </select>
          </div>
        </div>
      </div>

    </div>
  );
};
