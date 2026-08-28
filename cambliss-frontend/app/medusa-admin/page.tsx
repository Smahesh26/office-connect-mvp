"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MedusaAdminRedirect() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/admin-dashboard?tab=MARKETPLACE");
	}, [router]);

	return (
		<div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center p-6 font-sans">
			<div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#404d85] to-[#252f5a] flex items-center justify-center text-3xl shadow-xl animate-pulse mb-4">
				🛍️
			</div>
			<h1 className="text-xl font-black tracking-tight">MedusaJS v2 Marketplace Admin Panel</h1>
			<p className="text-xs text-zinc-400 mt-2">Redirecting to Marketplace Control Center...</p>
			<a
				href="/admin-dashboard?tab=MARKETPLACE"
				className="mt-6 rounded-xl bg-[#404d85] px-6 py-3 text-xs font-bold text-white shadow-lg hover:bg-[#323d6a] transition"
			>
				Click Here if Not Redirected Automatically ➔
			</a>
		</div>
	);
}
