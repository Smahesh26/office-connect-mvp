"use client";

import { useState } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { Input, SearchInput, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox, Radio, Switch } from "@/components/ui/Toggles";
import { Badge, Chip, StatusBadge } from "@/components/ui/Badge";
import { Modal, ConfirmationDialog } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { Tabs, AccordionItem, Breadcrumb, Pagination } from "@/components/ui/Navigation";
import { Alert, Spinner, Skeleton, EmptyState, ErrorState } from "@/components/ui/Feedback";
import {
  ProductCard,
  ProductPrice,
  Rating,
  QuantitySelector,
  SellerBadge,
  StockIndicator,
  DeliveryInformation,
} from "@/components/commerce/CommercePrimitives";
import { StatCard, PageHeader, DataTable, BulkActionsBar } from "@/components/admin/AdminPrimitives";

export default function DesignSystemShowcasePage() {
  const [activeTab, setActiveTab] = useState("all");
  const [switchVal, setSwitchVal] = useState(true);
  const [qty, setQty] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchVal, setSearchVal] = useState("");

  const sampleTableData = [
    { id: "SKU-101", name: "Damask Rose Botanical Hydrating Serum", seller: "Glow Beauty 🌸", stock: 240, price: "₹2,499", status: "ACTIVE" },
    { id: "SKU-102", name: "Titanium Wireless ANC Headphones", seller: "Office Connect 👑", stock: 45, price: "₹18,990", status: "ACTIVE" },
    { id: "SKU-103", name: "5W-40 Fully Synthetic Motor Oil", seller: "AutoCare Motors 🚘", stock: 0, price: "₹3,200", status: "INACTIVE" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black tracking-widest text-[#404d85] uppercase">
              Office Connect • Phase 2
            </span>
            <h1 className="text-xl font-black text-slate-900">Marketplace Design System & Component Library</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/storefront"
              className="text-xs font-bold text-[#404d85] hover:underline"
            >
              ← Back to Storefront
            </a>
            <Button size="sm" variant="primary" onClick={() => setIsModalOpen(true)}>
              Open Test Modal
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-12">
        {/* Navigation Filters */}
        <Tabs
          variant="pill"
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "all", label: "Overview & All Components" },
            { id: "tokens", label: "Design Tokens & Typography" },
            { id: "primitives", label: "UI Primitives" },
            { id: "commerce", label: "Commerce Components" },
            { id: "admin", label: "Admin & Operations" },
          ]}
        />

        {/* SECTION 1: DESIGN TOKENS & TYPOGRAPHY */}
        {(activeTab === "all" || activeTab === "tokens") && (
          <section className="space-y-6 bg-white p-6 rounded-[12px] border border-slate-200 shadow-2xs">
            <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
              🎨 1. Color Palette & Typography Tokens
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
              <div className="p-3 rounded-[6px] bg-[#404d85] text-white font-bold">Primary #404d85</div>
              <div className="p-3 rounded-[6px] bg-[#323d6a] text-white font-bold">Hover #323d6a</div>
              <div className="p-3 rounded-[6px] bg-[#0f172a] text-white font-bold">Ink / Slate-900</div>
              <div className="p-3 rounded-[6px] bg-emerald-600 text-white font-bold">Success #059669</div>
              <div className="p-3 rounded-[6px] bg-red-600 text-white font-bold">Destructive #dc2626</div>
              <div className="p-3 rounded-[6px] bg-amber-500 text-white font-bold">Rating #f59e0b</div>
            </div>

            <div className="space-y-2 pt-2 text-slate-800">
              <div className="text-2xl font-black">Headline 2XL (24px/32px) — Canonical Marketplace Header</div>
              <div className="text-lg font-bold">Headline LG (18px) — Section Title & Product Name</div>
              <div className="text-sm font-semibold">Body SM (14px) — Primary description text and specs</div>
              <div className="text-xs text-slate-500">Caption XS (12px) — Metadata, SKU identifiers, and timestamps</div>
            </div>
          </section>
        )}

        {/* SECTION 2: UI PRIMITIVES */}
        {(activeTab === "all" || activeTab === "primitives") && (
          <section className="space-y-6 bg-white p-6 rounded-[12px] border border-slate-200 shadow-2xs">
            <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
              🧱 2. Interactive UI Primitives
            </h2>

            {/* Buttons Row */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase">Buttons & States</h3>
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="primary" size="md">Primary Button</Button>
                <Button variant="secondary" size="md">Secondary</Button>
                <Button variant="outline" size="md">Outline</Button>
                <Button variant="ghost" size="md">Ghost</Button>
                <Button variant="destructive" size="md">Destructive</Button>
                <Button variant="success" size="md">Success</Button>
                <Button variant="primary" size="md" isLoading>Loading</Button>
                <Button variant="primary" size="md" disabled>Disabled</Button>
                <IconButton icon="⚙️" ariaLabel="Settings" />
              </div>
            </div>

            {/* Form Inputs Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <Input label="Standard Input" placeholder="Enter full name" />
              <SearchInput value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onClear={() => setSearchVal("")} />
              <Select label="Select Dropdown" options={[{ value: "1", label: "Option 1" }, { value: "2", label: "Option 2" }]} />
            </div>

            {/* Toggles Row */}
            <div className="flex flex-wrap gap-6 items-center pt-2">
              <Checkbox label="Default Checkbox" defaultChecked />
              <Radio label="Radio Option A" name="test-radio" defaultChecked />
              <Radio label="Radio Option B" name="test-radio" />
              <Switch checked={switchVal} onChange={setSwitchVal} label="Escrow Auto-Hold" />
            </div>

            {/* Badges & Chips */}
            <div className="flex flex-wrap gap-2 items-center pt-2">
              <Badge variant="brand">Brand Badge</Badge>
              <Badge variant="success" dot>Active Verified</Badge>
              <Badge variant="warning" dot>Pending Inspection</Badge>
              <Badge variant="destructive" dot>Suspended</Badge>
              <Chip label="Electronics" selected />
              <Chip label="Beauty Care" onRemove={() => {}} />
            </div>
          </section>
        )}

        {/* SECTION 3: COMMERCE PRIMITIVES */}
        {(activeTab === "all" || activeTab === "commerce") && (
          <section className="space-y-6 bg-white p-6 rounded-[12px] border border-slate-200 shadow-2xs">
            <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
              🛒 3. Commerce Specific Components
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <ProductCard
                id="demo-1"
                title="Damask Rose Botanical Hydrating Serum (50ml)"
                image="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80"
                price={2499}
                originalPrice={3200}
                sellerName="Glow Beauty Organics 🌸"
                sellerTier="premium"
                badge="FLASH SALE"
              />
              <ProductCard
                id="demo-2"
                title="Titanium ANC Wireless Headphones"
                image="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"
                price={18990}
                originalPrice={22490}
                sellerName="Office Connect Direct 👑"
                sellerTier="premium"
                badge="BEST SELLER"
              />
              <ProductCard
                id="demo-3"
                title="5W-40 Fully Synthetic Engine Oil (5L)"
                image="https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80"
                price={3200}
                sellerName="AutoCare Motors 🚘"
                sellerTier="verified"
              />
              <div className="p-4 rounded-[8px] border border-slate-200 bg-slate-50 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500">Standalone Controls</span>
                  <ProductPrice price={4999} originalPrice={6999} size="lg" />
                  <Rating score={4.9} reviewsCount={340} />
                  <StockIndicator stockQty={4} />
                  <DeliveryInformation deliveryDays={2} />
                </div>
                <QuantitySelector value={qty} onChange={setQty} />
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: ADMIN & OPERATIONS */}
        {(activeTab === "all" || activeTab === "admin") && (
          <section className="space-y-6 bg-white p-6 rounded-[12px] border border-slate-200 shadow-2xs">
            <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
              📊 4. Admin & Operational Primitives
            </h2>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Gross Merchandise Value (GMV)" value="₹14,82,450" change="18.4% vs last month" trend="up" icon="📈" />
              <StatCard title="Platform Commission (8.5%)" value="₹1,26,008" change="₹14,200 today" trend="up" icon="💳" />
              <StatCard title="Pending Seller Applications" value="12" change="3 SLA Breaches" trend="down" icon="📋" />
            </div>

            {/* Data Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase">Data Table & Status Badges</h3>
              <DataTable
                keyField="id"
                data={sampleTableData}
                columns={[
                  { header: "SKU", accessor: "id", className: "font-mono font-bold" },
                  { header: "Product Name", accessor: "name", className: "font-semibold" },
                  { header: "Seller", accessor: "seller" },
                  { header: "Stock", accessor: (row) => <StockIndicator stockQty={row.stock} /> },
                  { header: "Listing Price", accessor: "price", className: "font-black" },
                  { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
                ]}
              />
              <Pagination currentPage={currentPage} totalPages={4} onPageChange={setCurrentPage} />
            </div>

            {/* Feedback Alerts */}
            <div className="space-y-3 pt-2">
              <Alert variant="info" title="Scheduled Maintenance">
                Escrow batch processing will execute tonight at 02:00 UTC.
              </Alert>
              <Alert variant="success" title="Merchant Approved">
                Apex Electronics has completed 5-stage KYC verification.
              </Alert>
            </div>
          </section>
        )}
      </main>

      {/* MODALS & DRAWERS FOR INTERACTIVE TESTING */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Test Design System Modal"
        description="This modal demonstrates the standard dialog primitive."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Close</Button>
            <Button size="sm" onClick={() => { setIsModalOpen(false); setIsConfirmOpen(true); }}>Open Confirm Dialog</Button>
          </>
        }
      >
        <p className="leading-relaxed">All interactive components maintain standardized padding, font scales, focus rings, and dark-overlay backdrop blur.</p>
      </Modal>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => setIsConfirmOpen(false)}
        title="Confirm Operational Action"
        message="Are you sure you want to approve this seller application? This will create an active storefront immediately."
        confirmLabel="Approve Seller"
        variant="primary"
      />
    </div>
  );
}
