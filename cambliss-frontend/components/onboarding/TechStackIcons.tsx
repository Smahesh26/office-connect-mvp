import React from "react";

export const TechLogo: React.FC<{ code: string; className?: string }> = ({ code, className = "w-5 h-5" }) => {
	switch (code.toLowerCase()) {
		case "nextjs":
			return (
				<svg className={className} viewBox="0 0 180 180" fill="none">
					<mask id="mask0_next" maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="180" style={{ maskType: "alpha" }}>
						<circle cx="90" cy="90" r="90" fill="black" />
					</mask>
					<g mask="url(#mask0_next)">
						<circle cx="90" cy="90" r="90" fill="#000" />
						<path d="M149.508 157.438L69.1478 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.137 149.508 157.438Z" fill="url(#paint0_linear_next)" />
						<rect x="115" y="54" width="12" height="72" fill="url(#paint1_linear_next)" />
					</g>
					<defs>
						<linearGradient id="paint0_linear_next" x1="109" y1="116.5" x2="144.5" y2="160.5" gradientUnits="userSpaceOnUse">
							<stop stopColor="white" />
							<stop offset="1" stopColor="white" stopOpacity="0" />
						</linearGradient>
						<linearGradient id="paint1_linear_next" x1="121" y1="54" x2="120.799" y2="106.875" gradientUnits="userSpaceOnUse">
							<stop stopColor="white" />
							<stop offset="1" stopColor="white" stopOpacity="0" />
						</linearGradient>
					</defs>
				</svg>
			);
		case "react":
			return (
				<svg className={className} viewBox="-11.5 -10.23174 23 20.46348" fill="none">
					<circle cx="0" cy="0" r="2.05" fill="#61DAFB" />
					<g stroke="#61DAFB" strokeWidth="1" fill="none">
						<ellipse rx="11" ry="4.2" />
						<ellipse rx="11" ry="4.2" transform="rotate(60)" />
						<ellipse rx="11" ry="4.2" transform="rotate(120)" />
					</g>
				</svg>
			);
		case "vue3":
		case "nuxt3":
			return (
				<svg className={className} viewBox="0 0 256 221" fill="none">
					<path d="M204.8 0H256L128 220.8L0 0H97.92L128 51.2L157.44 0H204.8Z" fill="#41B883" />
					<path d="M0 0L128 220.8L256 0H204.8L128 132.48L50.56 0H0Z" fill="#35495E" />
				</svg>
			);
		case "angular":
			return (
				<svg className={className} viewBox="0 0 250 250" fill="none">
					<polygon points="125,30 125,30 125,30 31.9,63.2 46.1,186.3 125,230 125,230 125,230 203.9,186.3 218.1,63.2" fill="#DD0031" />
					<polygon points="125,30 125,52.2 125,52.1 125,153.4 125,153.4 125,230 203.9,186.3 218.1,63.2" fill="#C3002F" />
					<path d="M125,52.1L66.8,182.6H89.2L101,153.4H148.8L160.7,182.6H183.2L125,52.1ZM141.2,135H108.7L125,95.7L141.2,135Z" fill="#FFFFFF" />
				</svg>
			);
		case "svelte":
		case "sveltekit":
			return (
				<svg className={className} viewBox="0 0 100 100" fill="none">
					<circle cx="50" cy="50" r="45" fill="#FF3E00" />
					<path d="M43.5 28C38.8 28 35 31.8 35 36.5C35 44 45.2 45.6 45.2 49.3C45.2 51.5 43.4 53.2 41 53.2C38 53.2 35.2 51.5 33.7 48.8L26 53.7C29.2 59.2 34.8 62.5 41 62.5C46.8 62.5 51.5 57.8 51.5 52C51.5 44 41.3 42.4 41.3 38.7C41.3 36.8 42.8 35.5 44.8 35.5C47.2 35.5 49.8 36.8 51.2 39.2L58.5 34.5C55.7 29.8 50.8 28 43.5 28Z" fill="#FFF" />
				</svg>
			);
		case "remix":
			return (
				<svg className={className} viewBox="0 0 24 24" fill="currentColor">
					<path d="M4.5 3A2.5 2.5 0 002 5.5v13A2.5 2.5 0 004.5 21h15a2.5 2.5 0 002.5-2.5V8.83a2.5 2.5 0 00-.73-1.77l-4.33-4.33A2.5 2.5 0 0015.17 2H4.5A2.5 2.5 0 002 4.5zm11 1.5v3a1 1 0 001 1h3l-4-4z" />
				</svg>
			);
		case "nestjs":
			return (
				<svg className={className} viewBox="0 0 256 256" fill="none">
					<circle cx="128" cy="128" r="120" fill="#E0234E" fillOpacity="0.1" />
					<path d="M211.5 106.6C211.5 106.6 200.7 75.3 175.8 55.4C172.9 53 169.8 51.2 166.4 50.2C160.8 48.4 154.5 49.2 149.6 52.6C142.1 57.7 137.9 66.4 135.9 75.1C133.5 85.5 133.9 96.3 134.5 107C134.8 113.8 135.2 120.6 134.7 127.4C134.1 135.6 130.4 143.7 124 148.9C117.8 153.9 109.6 156.4 101.6 155.6C92.5 154.8 84.4 149.7 79.5 142C73.4 132.3 72.9 120 74.4 108.8C75.8 98.7 79.1 88.9 83.2 79.5C85.5 74.2 86.8 68.4 84.7 63C82.4 57.2 76.9 53.2 70.8 52.3C63.5 51.2 56.4 55.2 52.1 61.2C44.6 71.7 41.2 84.6 40.5 97.4C39.4 118.2 44.9 139.7 57.4 156.5C73.1 177.6 98.6 190.2 124.9 190.4C151.7 190.7 177.6 177.8 193.3 156.1C205.8 139.1 211.5 117.5 211.5 106.6Z" fill="#E0234E" />
				</svg>
			);
		case "nodejs":
			return (
				<svg className={className} viewBox="0 0 256 289" fill="none">
					<path d="M128 0L256 73.8462V221.538L128 295.385L0 221.538V73.8462L128 0Z" fill="#339933" />
					<path d="M128 32L228 90V205L128 263L28 205V90L128 32Z" fill="#FFFFFF" fillOpacity="0.2" />
					<path d="M128 65L200 106V190L128 231L56 190V106L128 65Z" fill="#339933" />
				</svg>
			);
		case "gofiber":
		case "golang":
		case "go":
			return (
				<svg className={className} viewBox="0 0 256 96" fill="none">
					<rect width="256" height="96" rx="20" fill="#00ADD8" fillOpacity="0.15" />
					<path d="M50 48C50 36.95 58.95 28 70 28C77.5 28 84 32.2 87.4 38.3L77.8 43.1C76.2 39.9 73.3 38 70 38C64.5 38 60 42.5 60 48C60 53.5 64.5 58 70 58C73.3 58 76.1 56.2 77.6 53.4H68V44H89.4C89.8 45.3 90 46.6 90 48C90 59.05 81.05 68 70 68C58.95 68 50 59.05 50 48ZM105 48C105 36.95 113.95 28 125 28C136.05 28 145 36.95 145 48C145 59.05 136.05 68 125 68C113.95 68 105 59.05 105 48ZM115 48C115 53.5 119.5 58 125 58C130.5 58 135 53.5 135 48C135 42.5 130.5 38 125 38C119.5 38 115 42.5 115 48ZM160 30H170V66H160V30ZM185 30H195V66H185V30Z" fill="#00ADD8" />
				</svg>
			);
		case "fastapi":
		case "python":
			return (
				<svg className={className} viewBox="0 0 100 100" fill="none">
					<circle cx="50" cy="50" r="45" fill="#059669" fillOpacity="0.12" />
					<path d="M50 15L25 55H46L38 85L75 45H54L62 15H50Z" fill="#059669" />
				</svg>
			);
		case "django":
			return (
				<svg className={className} viewBox="0 0 100 100" fill="none">
					<rect width="100" height="100" rx="20" fill="#092E20" />
					<text x="50" y="66" fill="#44B78B" fontSize="48" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">dj</text>
				</svg>
			);
		case "spring":
			return (
				<svg className={className} viewBox="0 0 100 100" fill="none">
					<circle cx="50" cy="50" r="45" fill="#6DB33F" fillOpacity="0.15" />
					<path d="M50 20C33.4 20 20 33.4 20 50C20 66.6 33.4 80 50 80C66.6 80 80 66.6 80 50C80 33.4 66.6 20 50 20ZM46.5 68.5C37.5 67.5 30.5 59.8 30.5 50.4C30.5 40.5 38.6 32.4 48.5 32.4C55.5 32.4 61.5 36.4 64.5 42.4L54.5 46.4C53 43.4 50 41.4 46.5 41.4C41.5 41.4 37.5 45.4 37.5 50.4C37.5 55.4 41.5 59.4 46.5 59.4C50 59.4 53 57.4 54.5 54.4L64.5 58.4C61.5 64.4 54.5 68.5 46.5 68.5Z" fill="#6DB33F" />
				</svg>
			);
		case "rails":
			return (
				<svg className={className} viewBox="0 0 100 100" fill="none">
					<rect width="100" height="100" rx="20" fill="#CC0000" />
					<path d="M30 25H70V40H58V75H42V40H30V25Z" fill="#FFFFFF" />
				</svg>
			);
		case "laravel":
			return (
				<svg className={className} viewBox="0 0 100 100" fill="none">
					<rect width="100" height="100" rx="20" fill="#FF2D20" fillOpacity="0.12" />
					<path d="M50 20L75 35V65L50 80L25 65V35L50 20Z" stroke="#FF2D20" strokeWidth="6" fill="none" />
					<path d="M50 20V80M25 35L75 65M75 35L25 65" stroke="#FF2D20" strokeWidth="4" />
				</svg>
			);
		case "postgresql":
			return (
				<svg className={className} viewBox="0 0 100 100" fill="none">
					<circle cx="50" cy="50" r="45" fill="#336791" fillOpacity="0.12" />
					<path d="M50 24C36.7 24 26 34.7 26 48C26 58.7 32.9 67.7 42.6 70.8V60.9C39.4 59.8 37.1 56.8 37.1 53.3C37.1 48.9 40.7 45.3 45.1 45.3C46.8 45.3 48.4 45.8 49.6 46.8V35.1C44.3 35.7 40.2 40.2 40.2 45.7H34.2C34.2 37 41.2 30 49.9 30C58.6 30 65.6 37 65.6 45.7H59.6C59.6 40.2 55.5 35.7 50.2 35.1V58C53.7 58 56.6 60.9 56.6 64.4C56.6 67.9 53.7 70.8 50.2 70.8H47.6V76.8H50.2C57.1 76.8 62.6 71.3 62.6 64.4C62.6 60.4 60.7 56.9 57.8 54.6C67.5 51.5 74 42.5 74 32C74 27.6 63.3 24 50 24Z" fill="#336791" />
				</svg>
			);
		case "mysql":
			return (
				<svg className={className} viewBox="0 0 100 100" fill="none">
					<circle cx="50" cy="50" r="45" fill="#00758F" fillOpacity="0.12" />
					<ellipse cx="50" cy="35" rx="26" ry="12" fill="#00758F" />
					<path d="M24 35V50C24 56.6 35.6 62 50 62C64.4 62 76 56.6 76 50V35" stroke="#00758F" strokeWidth="6" fill="none" />
					<path d="M24 50V65C24 71.6 35.6 77 50 77C64.4 77 76 71.6 76 65V50" stroke="#00758F" strokeWidth="6" fill="none" />
				</svg>
			);
		case "cockroachdb":
			return (
				<svg className={className} viewBox="0 0 100 100" fill="none">
					<rect width="100" height="100" rx="20" fill="#6933FF" fillOpacity="0.12" />
					<circle cx="50" cy="34" r="14" fill="#6933FF" />
					<circle cx="30" cy="66" r="12" fill="#6933FF" />
					<circle cx="70" cy="66" r="12" fill="#6933FF" />
					<path d="M50 34L30 66M50 34L70 66M30 66L70 66" stroke="#6933FF" strokeWidth="4" />
				</svg>
			);
		case "mongodb":
			return (
				<svg className={className} viewBox="0 0 100 100" fill="none">
					<circle cx="50" cy="50" r="45" fill="#13AA52" fillOpacity="0.12" />
					<path d="M50 18C48 24 34 38 34 54C34 68 44 78 50 82C56 78 66 68 66 54C66 38 52 24 50 18Z" fill="#13AA52" />
					<path d="M50 18V82" stroke="#FFF" strokeWidth="2" />
				</svg>
			);
		case "redis":
			return (
				<svg className={className} viewBox="0 0 100 100" fill="none">
					<rect width="100" height="100" rx="20" fill="#D82C20" fillOpacity="0.12" />
					<polygon points="50,22 80,38 50,54 20,38" fill="#D82C20" />
					<polygon points="50,44 80,60 50,76 20,60" fill="#A82015" />
				</svg>
			);
		case "aws":
			return (
				<svg className={className} viewBox="0 0 100 100" fill="none">
					<rect width="100" height="100" rx="20" fill="#232F3E" />
					<path d="M28 62C40 68 60 68 72 62M70 59L74 63L70 67" stroke="#FF9900" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
					<text x="50" y="46" fill="#FFF" fontSize="24" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">AWS</text>
				</svg>
			);
		case "vercel":
			return (
				<svg className={className} viewBox="0 0 24 24" fill="currentColor">
					<polygon points="12,2 22,20 2,20" fill="currentColor" />
				</svg>
			);
		case "gcp":
			return (
				<svg className={className} viewBox="0 0 100 100" fill="none">
					<rect width="100" height="100" rx="20" fill="#4285F4" fillOpacity="0.12" />
					<circle cx="50" cy="50" r="28" stroke="#4285F4" strokeWidth="8" fill="none" />
					<path d="M50 36H78V64H50" stroke="#EA4335" strokeWidth="8" fill="none" />
				</svg>
			);
		case "azure":
			return (
				<svg className={className} viewBox="0 0 100 100" fill="none">
					<rect width="100" height="100" rx="20" fill="#0089D6" fillOpacity="0.12" />
					<path d="M25 75L48 25H65L42 75H25ZM46 52L56 75H75L62 45L46 52Z" fill="#0089D6" />
				</svg>
			);
		default:
			return (
				<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
					<rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
					<rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
					<line x1="6" y1="6" x2="6.01" y2="6" />
					<line x1="6" y1="18" x2="6.01" y2="18" />
				</svg>
			);
	}
};

export const RazorpayBadgeLogo: React.FC<{ className?: string }> = ({ className = "h-5" }) => (
	<svg className={className} viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="M12.5 4L4 26H10L14.5 14.5L18 20.5H24.5L18.5 10L22 4H12.5Z" fill="#0284C7" />
		<text x="32" y="21" fill="#0C2340" fontSize="16" fontWeight="900" fontFamily="sans-serif" letterSpacing="-0.5px">
			Razorpay
		</text>
	</svg>
);

export const getTechTagline = (code: string): string => {
	switch (code.toLowerCase()) {
		case "nextjs":
			return "Full-Stack App Router & SSR";
		case "react":
			return "High-Performance SPA Vite";
		case "vue3":
		case "nuxt3":
			return "Composition API & Universal SSR";
		case "angular":
			return "Enterprise TypeScript Framework";
		case "remix":
			return "Web Standards & Edge Ready";
		case "svelte":
		case "sveltekit":
			return "Zero-Virtual-DOM Cybernetically Fast";
		case "nestjs":
			return "Modular Microservices & DDD";
		case "gofiber":
		case "go":
			return "Sub-millisecond Ultra Throughput";
		case "nodejs":
			return "Asynchronous Event-Driven API";
		case "fastapi":
			return "Async Python & AI Native Pipelines";
		case "django":
			return "Batteries-Included Robust Backend";
		case "spring":
			return "High-Concurrency Java Ecosystem";
		case "rails":
			return "Convention Over Configuration";
		case "laravel":
			return "Elegant MVC & Artisan Workflows";
		case "postgresql":
			return "ACID Relational + Vector Embeddings";
		case "cockroachdb":
			return "Global Multi-Region Distributed SQL";
		case "mysql":
			return "Battle-Tested High-Read Database";
		case "mongodb":
			return "Flexible Distributed Document Store";
		case "redis":
			return "In-Memory Microsecond Cache & Pub/Sub";
		case "aws":
			return "Elastic Container Service & Aurora";
		case "vercel":
			return "Global Low-Latency Edge Network";
		case "gcp":
			return "Google Cloud Run & Cloud SQL";
		case "azure":
			return "Enterprise Kubernetes AKS Cluster";
		default:
			return "Cloud Production Architecture";
	}
};
