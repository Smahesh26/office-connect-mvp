import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-16 h-16 rounded-full bg-red-900/40 border border-red-500/50 flex items-center justify-center text-2xl mb-4 text-red-400">
        🛡️
      </div>
      <h1 className="text-3xl font-black text-white">403 — Access Denied</h1>
      <p className="text-slate-400 max-w-md mt-2 text-sm leading-relaxed">
        Your account does not possess the required server-verified credentials or permissions to access this privileged portal.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/login"
          className="px-4 py-2 rounded-[6px] bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs transition"
        >
          Sign In with Authorized Account
        </Link>
        <Link
          href="/storefront"
          className="px-4 py-2 rounded-[6px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
        >
          Return to Storefront
        </Link>
      </div>
    </div>
  );
}
