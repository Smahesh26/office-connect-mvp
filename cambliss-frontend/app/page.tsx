import { readFileSync } from "fs";
import path from "path";

const referencePath = path.resolve(process.cwd(), "..", "OfficeConnect_Landing_Page (3) (1).html");

function loadReferenceHtml() {
	try {
		const html = readFileSync(referencePath, "utf8");
		const normalizedHtml = (() => {
			const logoMatches = [...html.matchAll(/<img[^>]*src="(data:image\/png;base64,[^"]+)"[^>]*alt="Office Connect"[^>]*>/g)];
			let nextHtml = html;

			if (logoMatches.length >= 2) {
				const headerLogo = logoMatches[0][1];
				const footerLogo = logoMatches[logoMatches.length - 1][1];
				nextHtml = nextHtml.replace(headerLogo, footerLogo);
			}

			nextHtml = nextHtml
				.replace('<a href="#" class="signin">Sign in</a>', '<a href="/login" class="signin">Sign in</a>')
				.replace('<a href="#offer" class="btn btn-primary">Start free trial</a>', '<a href="/register" class="btn btn-primary">Start free trial</a>')
				.replace('<a href="#offer" class="btn btn-primary">Start free — no card required</a>', '<a href="/register" class="btn btn-primary">Start free — no card required</a>')
				.replace('<a href="#modules" class="btn btn-ghost">Explore the platform</a>', '<a href="/login" class="btn btn-ghost">Explore the platform</a>')
				.replace('<a href="#" class="btn btn-white">Claim your free 90 days</a>', '<a href="/register" class="btn btn-white">Claim your free 90 days</a>')
				.replace('<a href="#" class="btn btn-primary">Start your free workspace</a>', '<a href="/register" class="btn btn-primary">Start your free workspace</a>')
				.replace('<a href="#" class="btn btn-ghost">Book a demo</a>', '<a href="/login" class="btn btn-ghost">Book a demo</a>');

			return nextHtml;
		})();
		return normalizedHtml;
	} catch {
		return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Office Connect</title></head><body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#fff;color:#1f2430;"><div style="padding:40px">Office Connect landing page reference file could not be loaded.</div></body></html>`;
	}
}

export default function Home() {
	const html = loadReferenceHtml();
	const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
	const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
	const referenceCss = (styleMatch?.[1] || "").replace(/body\s*\{/m, ".oc-reference{");
	const bodyContent = bodyMatch?.[1] || html;

	return (
		<main className="oc-reference min-h-screen w-full bg-white">
			<style dangerouslySetInnerHTML={{ __html: referenceCss }} />
			<div dangerouslySetInnerHTML={{ __html: bodyContent }} />
		</main>
	);
}
