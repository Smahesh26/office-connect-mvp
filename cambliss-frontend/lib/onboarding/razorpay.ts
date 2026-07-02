import type { RazorpayOrder, RazorpayVerifyPayload } from "./types";

export type RazorpayPrefill = {
	name: string;
	email: string;
	contact: string;
};

export type RazorpayCheckoutParams = {
	key: string;
	order: RazorpayOrder;
	name: string;
	description: string;
	prefill: RazorpayPrefill;
};

type RazorpayFailurePayload = {
	error?: {
		description?: string;
		reason?: string;
		source?: string;
		step?: string;
	};
};

export type RazorpayInstance = {
	open: () => void;
	on: (event: "payment.failed", handler: (payload: RazorpayFailurePayload) => void) => void;
};

export type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
	interface Window {
		Razorpay?: RazorpayConstructor;
	}
}

let razorpayScriptPromise: Promise<boolean> | null = null;

export const ensureRazorpayScriptLoaded = (): Promise<boolean> => {
	if (typeof window === "undefined") {
		return Promise.resolve(false);
	}

	if (window.Razorpay) {
		return Promise.resolve(true);
	}

	if (razorpayScriptPromise) {
		return razorpayScriptPromise;
	}

	razorpayScriptPromise = new Promise<boolean>((resolve) => {
		const script = document.createElement("script");
		script.src = "https://checkout.razorpay.com/v1/checkout.js";
		script.async = true;
		script.onload = () => resolve(true);
		script.onerror = () => resolve(false);
		document.body.appendChild(script);
	});

	return razorpayScriptPromise;
};

export const openRazorpayCheckout = (params: RazorpayCheckoutParams): Promise<RazorpayVerifyPayload> => {
	if (!window.Razorpay) {
		return Promise.reject(new Error("Razorpay checkout is unavailable"));
	}

	return new Promise<RazorpayVerifyPayload>((resolve, reject) => {
		const checkout = new window.Razorpay!({
			key: params.key,
			amount: params.order.amount,
			currency: params.order.currency,
			name: params.name,
			description: params.description,
			order_id: params.order.id,
			prefill: params.prefill,
			handler: (response: RazorpayVerifyPayload) => resolve(response),
		});

		checkout.on("payment.failed", (payload) => {
			const message = payload.error?.description || payload.error?.reason || "Payment failed or was cancelled";
			reject(new Error(message));
		});

		checkout.open();
	});
};
