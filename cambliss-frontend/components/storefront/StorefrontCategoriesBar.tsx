"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface SubCategoryItem {
  title: string;
  items: string[];
}

interface MegaMenuData {
  title: string;
  slug: string;
  subcategories: SubCategoryItem[];
  featuredPromo?: {
    title: string;
    subtitle: string;
    badge: string;
    href: string;
  };
}

export const StorefrontCategoriesBar = () => {
  const [activeMegaCategory, setActiveMegaCategory] = useState<string | null>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);

  const categories: MegaMenuData[] = [
    {
      title: "All Categories",
      slug: "all",
      subcategories: [
        {
          title: "Top Departments",
          items: ["Electronics & Audio", "Mobiles & Tablets", "Fashion & Apparel", "Home & Kitchen"],
        },
        {
          title: "Essentials",
          items: ["Beauty & Personal Care", "Grocery & Gourmet", "Large Appliances", "Automotive Spares"],
        },
        {
          title: "Lifestyle & Media",
          items: ["Sports & Outdoors", "Books & Stationery", "Toys & Baby Care", "Office Furniture"],
        },
      ],
    },
    {
      title: "Electronics",
      slug: "electronics",
      subcategories: [
        {
          title: "Audio & Headphones",
          items: ["Over-Ear Headphones", "True Wireless Earbuds", "Soundbars & Home Audio", "Studio Monitors"],
        },
        {
          title: "Computers & IT",
          items: ["Laptops & MacBooks", "Mechanical Keyboards", "Ergonomic Mice", "Ultrawide Monitors"],
        },
        {
          title: "Cameras & Accessories",
          items: ["Mirrorless Cameras", "Lenses & Optics", "Tripods & Rigs", "Camera Microphones"],
        },
      ],
      featuredPromo: {
        title: "AeroTech Studio Audio",
        subtitle: "High-performance ANC up to 40% off",
        badge: "VERIFIED MERCHANT",
        href: "/brand/aerotech",
      },
    },
    {
      title: "Mobiles",
      slug: "mobiles",
      subcategories: [
        {
          title: "Smartphones",
          items: ["Flagship 5G Phones", "Gaming Smartphones", "Budget 5G Phones", "Foldable Displays"],
        },
        {
          title: "Accessories",
          items: ["Fast GaN Chargers", "Wireless MagSafe Pads", "Tough Protective Cases", "Tempered Screen Protectors"],
        },
        {
          title: "Wearables",
          items: ["Health & Fitness Watches", "Cellular Smartwatches", "Sports Activity Trackers"],
        },
      ],
    },
    {
      title: "Fashion",
      slug: "fashion",
      subcategories: [
        {
          title: "Men's Apparel",
          items: ["Heavyweight Oversized Tees", "Formal Cotton Shirts", "Japanese Raw Denim", "Blazers & Suits"],
        },
        {
          title: "Women's Apparel",
          items: ["Ethnic Kurti Sets", "Designer Dresses", "Activewear Leggings", "Cashmere Sweaters"],
        },
        {
          title: "Footwear & Bags",
          items: ["Sneakers & Trainers", "Formal Leather Shoes", "Leather Messenger Bags", "Travel Backpacks"],
        },
      ],
    },
    {
      title: "Home & Kitchen",
      slug: "home-kitchen",
      subcategories: [
        {
          title: "Kitchen & Dining",
          items: ["Cast Iron Cookware", "Espresso Coffee Machines", "Air Fryers & Blenders", "Knife Sets"],
        },
        {
          title: "Living & Decor",
          items: ["Ergonomic Desks & Chairs", "Minimalist Table Lamps", "Cotton Bedding & Sheets"],
        },
        {
          title: "Organization",
          items: ["Modular Storage Bins", "Cable Management Racks", "Aromatherapy Diffusers"],
        },
      ],
    },
    {
      title: "Beauty",
      slug: "beauty",
      subcategories: [
        {
          title: "Skincare",
          items: ["Botanical Hydrating Serums", "Vitamin C Brightening Creams", "Sunscreen SPF 50+", "Night Retinol Balms"],
        },
        {
          title: "Hair & Body",
          items: ["Organic Sulfate-Free Shampoo", "Nourishing Hair Oils", "French Exfoliating Body Scrubs"],
        },
        {
          title: "Fragrance",
          items: ["Artisanal Eau de Parfum", "Solid Perfumes", "Aromatic Body Mists"],
        },
      ],
    },
    {
      title: "Grocery",
      slug: "grocery",
      subcategories: [
        {
          title: "Pantry Staples",
          items: ["Single-Estate Cold Brew Coffee", "Organic Extra Virgin Olive Oil", "Artisan Dark Chocolates", "Raw Organic Honey"],
        },
        {
          title: "Health & Nutrition",
          items: ["Whey Isolate Protein", "Multivitamins & Omega-3", "Electrolyte Hydration Powders"],
        },
      ],
    },
    {
      title: "Appliances",
      slug: "appliances",
      subcategories: [
        {
          title: "Small Appliances",
          items: ["Microwave Ovens", "Robotic Vacuum Cleaners", "Induction Cooktops", "Water Purifiers (RO+UV)"],
        },
        {
          title: "Climate Control",
          items: ["Inverter Air Conditioners", "Smart Air Purifiers", "Ceramic Room Heaters"],
        },
      ],
    },
    {
      title: "Sports",
      slug: "sports",
      subcategories: [
        {
          title: "Fitness Equipment",
          items: ["Adjustable Dumbbell Sets", "TPE Non-Slip Yoga Mats", "Resistance Bands Kit"],
        },
        {
          title: "Outdoor & Trekking",
          items: ["Waterproof Trekking Tents", "Insulated Hydro Flasks", "Tactical Flashlights"],
        },
      ],
    },
    {
      title: "Books",
      slug: "books",
      subcategories: [
        {
          title: "Categories",
          items: ["Business & Economics", "Software Engineering & AI", "Science Fiction & Fantasy", "Biographies & Memoirs"],
        },
      ],
    },
    {
      title: "Toys",
      slug: "toys",
      subcategories: [
        {
          title: "Categories",
          items: ["STEM Learning Kits", "Building Blocks & Lego", "Remote Control Drones", "Board Games & Puzzles"],
        },
      ],
    },
    {
      title: "Automotive",
      slug: "automotive",
      subcategories: [
        {
          title: "Maintenance & Care",
          items: ["Fully Synthetic Engine Oil", "Microfiber Detailing Towels", "Ceramic Wax Coatings", "Digital Tire Inflators"],
        },
        {
          title: "Accessories",
          items: ["4K Dash Cameras", "Magnetic Phone Car Mounts", "HEPA Cabin Air Filters"],
        },
      ],
    },
  ];

  // Close mega menu on mouse leave
  const handleMouseLeave = () => {
    setActiveMegaCategory(null);
  };

  const currentMegaData = categories.find((c) => c.slug === activeMegaCategory);

  return (
    <div
      ref={megaMenuRef}
      onMouseLeave={handleMouseLeave}
      className="relative bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 select-none hidden md:block"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Horizontal Navigation List */}
        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-1.5">
          {categories.map((cat, idx) => {
            const isAll = cat.slug === "all";
            const isActive = activeMegaCategory === cat.slug;

            return (
              <div key={cat.slug} className="shrink-0">
                <button
                  type="button"
                  onMouseEnter={() => setActiveMegaCategory(cat.slug)}
                  className={`px-3 py-1.5 rounded-[4px] transition flex items-center gap-1.5 ${
                    isAll
                      ? "bg-[#404d85] text-white hover:bg-[#323d6a] font-bold shadow-2xs"
                      : isActive
                      ? "bg-white text-[#404d85] shadow-xs font-bold border border-slate-200"
                      : "hover:bg-slate-200/70 hover:text-slate-900"
                  }`}
                >
                  {isAll && <span>☰</span>}
                  <span>{cat.title}</span>
                  {!isAll && <span className="text-[8px] text-slate-400">▼</span>}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Structured Desktop Mega Menu Dropdown */}
      {currentMegaData && (
        <div className="absolute left-0 right-0 top-full bg-white border-b border-slate-200 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="grid grid-cols-12 gap-6">
              
              {/* Columns for Subcategories */}
              <div className={currentMegaData.featuredPromo ? "col-span-9 grid grid-cols-3 gap-6" : "col-span-12 grid grid-cols-4 gap-6"}>
                {currentMegaData.subcategories.map((sub, idx) => (
                  <div key={idx} className="space-y-3">
                    <h5 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                      {sub.title}
                    </h5>
                    <ul className="space-y-2 text-xs font-medium text-slate-600">
                      {sub.items.map((item, i) => (
                        <li key={i}>
                          <Link
                            href={`/category/${currentMegaData.slug}?sub=${encodeURIComponent(item)}`}
                            className="hover:text-[#404d85] hover:underline block truncate transition"
                          >
                            {item}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Optional Featured Promo Card */}
              {currentMegaData.featuredPromo && (
                <div className="col-span-3 border-l border-slate-100 pl-6 space-y-3 flex flex-col justify-between">
                  <div className="p-4 rounded-[6px] bg-slate-900 text-white space-y-2 shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded">
                      {currentMegaData.featuredPromo.badge}
                    </span>
                    <h6 className="font-extrabold text-sm text-white">{currentMegaData.featuredPromo.title}</h6>
                    <p className="text-xs text-slate-300">{currentMegaData.featuredPromo.subtitle}</p>
                    <Link
                      href={currentMegaData.featuredPromo.href}
                      className="inline-block mt-2 text-xs font-bold text-amber-300 hover:text-white underline"
                    >
                      Explore Brand Hub →
                    </Link>
                  </div>

                  <Link
                    href={`/category/${currentMegaData.slug}`}
                    className="w-full py-2 text-center rounded-[6px] border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition"
                  >
                    View All {currentMegaData.title} ({currentMegaData.subcategories.reduce((acc, curr) => acc + curr.items.length, 0)} Items) →
                  </Link>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
