"use client";

export interface MediaData {
  primaryImage: string;
  galleryImages: string[];
}

export const SectionMedia = ({
  data,
  onChange,
}: {
  data: MediaData;
  onChange: (data: MediaData) => void;
}) => {
  const handleAddGalleryImage = () => {
    const url = prompt("Enter high-resolution image URL:");
    if (url && url.trim()) {
      onChange({
        ...data,
        galleryImages: [...data.galleryImages, url.trim()],
      });
    }
  };

  const handleRemoveGalleryImage = (idx: number) => {
    onChange({
      ...data,
      galleryImages: data.galleryImages.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-6 text-xs select-none">
      
      <div className="pb-3 border-b border-slate-100">
        <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
          3. Images & Media Assets
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          Upload clean, high-resolution product photography (minimum 1000×1000 px for optical zoom).
        </p>
      </div>

      {/* Primary Hero Image */}
      <div className="p-4 rounded-[6px] border border-slate-200 bg-slate-50 space-y-3">
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-900 text-xs">
            Primary Catalog Hero Image (White / Clean Background) *
          </label>
          <span className="text-[10px] text-emerald-700 font-black">HERO ASSET</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="w-28 h-28 rounded-[6px] border border-slate-300 bg-white p-1 overflow-hidden shrink-0 flex items-center justify-center">
            {data.primaryImage ? (
              <img
                src={data.primaryImage}
                alt="Hero Preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-2xl">📸</span>
            )}
          </div>

          <div className="flex-1 w-full space-y-2">
            <input
              type="text"
              value={data.primaryImage}
              onChange={(e) => onChange({ ...data, primaryImage: e.target.value })}
              placeholder="Enter HTTPS Image URL..."
              className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-mono text-[11px]"
            />
            <p className="text-[11px] text-slate-500">
              This image is used on PLP search cards, category listings, and main purchase hero.
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Angle Gallery */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-700 block">
            Multi-Angle Gallery Images ({data.galleryImages.length} of 8 uploaded)
          </label>
          <button
            type="button"
            onClick={handleAddGalleryImage}
            className="text-xs font-bold text-[#404d85] hover:underline"
          >
            + Add Image URL
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {data.galleryImages.map((img, idx) => (
            <div
              key={idx}
              className="relative p-2 rounded-[6px] border border-slate-200 bg-white space-y-1 group"
            >
              <div className="w-full h-28 rounded bg-slate-50 overflow-hidden flex items-center justify-center p-1">
                <img src={img} alt="" className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400 font-mono">Angle {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveGalleryImage(idx)}
                  className="text-red-600 font-bold hover:underline text-[10px]"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {/* Upload Placeholder Tile */}
          <button
            type="button"
            onClick={handleAddGalleryImage}
            className="h-36 rounded-[6px] border-2 border-dashed border-slate-300 hover:border-[#404d85] bg-slate-50/50 flex flex-col items-center justify-center gap-1.5 transition text-slate-500 hover:text-[#404d85]"
          >
            <span className="text-2xl">➕</span>
            <span className="font-bold text-[11px]">Add Angle</span>
          </button>
        </div>
      </div>

    </div>
  );
};
