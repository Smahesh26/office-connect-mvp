"use client";

export interface BasicInfoData {
  title: string;
  brand: string;
  subtitle: string;
  hsnCode: string;
  countryOfOrigin: string;
  highlights: string[];
  description: string;
}

export const SectionBasicInfo = ({
  data,
  onChange,
}: {
  data: BasicInfoData;
  onChange: (data: BasicInfoData) => void;
}) => {
  const handleHighlightChange = (index: number, val: string) => {
    const updated = [...data.highlights];
    updated[index] = val;
    onChange({ ...data, highlights: updated });
  };

  const handleAddHighlight = () => {
    onChange({ ...data, highlights: [...data.highlights, ""] });
  };

  const handleRemoveHighlight = (index: number) => {
    onChange({
      ...data,
      highlights: data.highlights.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6 text-xs select-none">
      
      <div className="pb-3 border-b border-slate-100">
        <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
          1. Basic Product Information
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          Enter official product name, brand affiliation, HSN tax classifications, and key selling highlights.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Product Title */}
        <div className="sm:col-span-2">
          <label className="font-bold text-slate-700 block mb-1">
            Product Title / Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Premium Heavyweight 240 GSM Oversized Cotton T-Shirt"
            value={data.title}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded font-bold text-slate-900 focus:border-[#404d85]"
          />
          <span className="text-[10px] text-slate-400 block pt-1">
            Recommended: Include Brand + Key Attributes + Model + Primary Finish
          </span>
        </div>

        {/* Brand */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">
            Brand Affiliation *
          </label>
          <select
            value={data.brand}
            onChange={(e) => onChange({ ...data, brand: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded font-bold bg-white"
          >
            <option value="Sony">👑 Sony (Authorized Flagship)</option>
            <option value="Keychron">👑 Keychron (Official India)</option>
            <option value="UrbanThreads">UrbanThreads Premium Apparel</option>
            <option value="OfficeConnect">Office Connect Private Label</option>
            <option value="Custom">Other / Custom Brand</option>
          </select>
        </div>

        {/* Short Subtitle */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">
            Short Subtitle / Tagline
          </label>
          <input
            type="text"
            placeholder="e.g. Crafted with 100% Organic Ring-Spun Combed Cotton"
            value={data.subtitle}
            onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded"
          />
        </div>

        {/* HSN Code */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">
            8-Digit HSN Code (GST Compliance) *
          </label>
          <input
            type="text"
            required
            maxLength={8}
            placeholder="61091000"
            value={data.hsnCode}
            onChange={(e) => onChange({ ...data, hsnCode: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-bold"
          />
        </div>

        {/* Country of Origin */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">
            Country of Origin *
          </label>
          <select
            value={data.countryOfOrigin}
            onChange={(e) => onChange({ ...data, countryOfOrigin: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded font-bold bg-white"
          >
            <option value="India">🇮🇳 India</option>
            <option value="Japan">🇯🇵 Japan</option>
            <option value="Germany">🇩🇪 Germany</option>
            <option value="United States">🇺🇸 United States</option>
            <option value="Vietnam">🇻🇳 Vietnam</option>
          </select>
        </div>

      </div>

      {/* Bullet Highlights */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-700 block">
            Key Feature Bullet Highlights (Appears above the Buy Box)
          </label>
          <button
            type="button"
            onClick={handleAddHighlight}
            className="text-xs font-bold text-[#404d85] hover:underline"
          >
            + Add Highlight
          </button>
        </div>

        <div className="space-y-2">
          {data.highlights.map((hl, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="w-6 h-8 flex items-center justify-center font-bold text-slate-400 bg-slate-100 rounded text-xs">
                {idx + 1}
              </span>
              <input
                type="text"
                value={hl}
                placeholder="e.g. 240 GSM Super-Combed Bio-Washed French Terry fabric"
                onChange={(e) => handleHighlightChange(idx, e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-xs"
              />
              {data.highlights.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveHighlight(idx)}
                  className="px-2.5 text-red-600 hover:bg-red-50 rounded font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Full Description */}
      <div>
        <label className="font-bold text-slate-700 block mb-1">
          Detailed Product Description *
        </label>
        <textarea
          rows={4}
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="Describe product craftsmanship, ergonomic benefits, styling guidelines, and warranty details..."
          className="w-full px-3 py-2 border border-slate-300 rounded text-xs leading-relaxed"
        />
      </div>

    </div>
  );
};
