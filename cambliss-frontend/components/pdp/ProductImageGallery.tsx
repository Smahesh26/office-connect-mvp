"use client";

import { useState } from "react";

export const ProductImageGallery = ({
  images,
  title,
  badge,
}: {
  images: string[];
  title: string;
  badge?: string;
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePosition({ x, y });
  };

  const activeImg = images[activeImageIndex] || images[0];

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 select-none">
      
      {/* Thumbnail Strip */}
      <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto scrollbar-none shrink-0">
        {images.map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveImageIndex(idx)}
            className={`w-16 h-16 md:w-20 md:h-20 rounded-[6px] border-2 overflow-hidden bg-slate-50 transition shrink-0 ${
              activeImageIndex === idx
                ? "border-[#404d85] shadow-xs"
                : "border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
            }`}
          >
            <img src={img} alt={`${title} - Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Main Showcase Image with Zoom */}
      <div
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        className="relative flex-1 aspect-square rounded-[8px] bg-slate-50 border border-slate-200 overflow-hidden cursor-crosshair"
      >
        <img
          src={activeImg}
          alt={title}
          className={`w-full h-full object-cover transition-transform duration-200 ${
            isZoomed ? "scale-150" : "scale-100"
          }`}
          style={
            isZoomed
              ? {
                  transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                }
              : undefined
          }
        />

        {/* Badge Overlay */}
        {badge && (
          <span className="absolute top-3 left-3 bg-slate-900/90 text-white text-[10px] font-black px-2.5 py-1 rounded backdrop-blur-xs shadow-xs">
            {badge}
          </span>
        )}

        <span className="absolute bottom-3 right-3 bg-slate-900/70 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
          🔍 Hover to Zoom
        </span>
      </div>

    </div>
  );
};
