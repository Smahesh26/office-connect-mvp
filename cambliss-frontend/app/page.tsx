import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#edf2ff] via-[#dfe9ff] to-[#edf2ff] text-[#35558e] flex items-center justify-center px-6 py-16">
      <main className="w-full max-w-3xl rounded-3xl border border-[#d7e0f7] bg-white text-[#35558e] p-10 shadow-[0_26px_70px_-34px_rgba(29,65,157,0.45)]">
        <div className="text-center">
          <div className="mx-auto w-fit">
            <Image src="/officeconnectlogo.png" alt="Office Connect" width={470} height={126} priority className="h-32 w-auto object-contain" />
          </div>
          <h1 className="mt-3 text-4xl font-bold text-[#1d419d]">AI ERP Platform</h1>
          <p className="mt-3 text-[#6f84ad]">Financial intelligence, GST automation, and executive reporting.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            className="flex h-12 items-center justify-center rounded-lg bg-[#1d419d] text-white font-medium hover:bg-[#173784] transition-colors"
            href="/dashboard"
          >
            Open Module Launcher
          </a>
          <a
            className="flex h-12 items-center justify-center rounded-lg border border-[#d7e0f7] font-medium hover:bg-[#f3f7ff] transition-colors"
            href="/login"
          >
            Login
          </a>
          <a
            className="flex h-12 items-center justify-center rounded-lg border border-[#d7e0f7] font-medium hover:bg-[#f3f7ff] transition-colors"
            href="/register"
          >
            Register
          </a>
          <a
            className="flex h-12 items-center justify-center rounded-lg border border-[#d7e0f7] font-medium hover:bg-[#f3f7ff] transition-colors"
            href="/finance-dashboard"
          >
            Open Finance Dashboard
          </a>
          <a
            className="flex h-12 items-center justify-center rounded-lg border border-[#d7e0f7] font-medium hover:bg-[#f3f7ff] transition-colors"
            href="/ceo-report"
          >
            Open CEO Report
          </a>
        </div>
      </main>
    </div>
  );
}
