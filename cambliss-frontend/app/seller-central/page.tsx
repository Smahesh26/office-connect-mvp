import Link from "next/link";

const blocks = [
  {
    title: "What You Get",
    points: [
      "Create your seller storefront on localhost",
      "Set manual categories, products, banners and rates",
      "Configure bank details and Razorpay settings",
      "Get a separate storefront URL for customer orders",
    ],
  },
  {
    title: "Seller Flow",
    points: [
      "Login/Register to create your seller profile",
      "Create your store and auto-generate domain from store name",
      "Upload catalog, set prices and payment details",
      "Share your store URL and start receiving orders",
    ],
  },
];

export default function SellerCentralPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#f5f9ff_0%,#f3f4f6_38%,#eef2ff_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.9)] backdrop-blur sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Seller Central</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-zinc-900 sm:text-4xl">
            Build your own ecommerce storefront, manage products manually, and start taking orders.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-600 sm:text-base">
            This is your Seller Central entry page on localhost, similar to an Amazon Seller Central style onboarding flow.
            Create your seller profile, configure store details, and manage storefront operations from one place.
          </p>

          <div className="mt-6 grid gap-3 text-sm text-zinc-700 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              Seller Central URL: <span className="font-semibold text-zinc-900">http://localhost:3000/seller-central</span>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              Seller Dashboard URL: <span className="font-semibold text-zinc-900">http://localhost:3000/ecommerce</span>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              Storefront URL: <span className="font-semibold text-zinc-900">http://localhost:3000/store/&lt;domain&gt;</span>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/login?next=/ecommerce"
              className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Login as Seller
            </Link>
            <Link
              href="/register?next=/ecommerce"
              className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-100"
            >
              Register Seller
            </Link>
            <Link
              href="/ecommerce"
              className="rounded-xl border border-sky-200 bg-sky-50 px-5 py-2.5 text-sm font-semibold text-sky-800 hover:bg-sky-100"
            >
              Open Seller Dashboard
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {blocks.map((block) => (
            <article
              key={block.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_22px_55px_-40px_rgba(15,23,42,0.8)]"
            >
              <h2 className="text-lg font-semibold text-zinc-900">{block.title}</h2>
              <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                {block.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-zinc-800" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
