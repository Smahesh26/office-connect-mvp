import type {
	MeResponse,
	OnboardingState,
	OnboardingUpdateRequest,
	PlanSummary,
	RazorpayOrder,
	RazorpayVerifyPayload,
	SubscriptionSnapshot,
	TechStackResponse,
	OrganizationForm,
} from "./types";

export type FetchLike = typeof fetch;

const DEFAULT_JSON_HEADERS = {
	"Content-Type": "application/json",
};

export class OnboardingApiClient {
	private readonly token: string;
	private readonly fetchImpl: FetchLike;

	constructor(token: string, fetchImpl: FetchLike = fetch) {
		this.token = token;
		this.fetchImpl = fetchImpl;
	}

	private async request(path: string, init: RequestInit = {}): Promise<Response> {
		const headers = {
			Authorization: `Bearer ${this.token}`,
			...init.headers,
		};

		return this.fetchImpl(path, {
			...init,
			headers,
		});
	}

	private async requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
		const response = await this.request(path, init);
		if (!response.ok) {
			const message = await response.text();
			throw new Error(message || `Request failed: ${path}`);
		}
		return (await response.json()) as T;
	}

	async getMe(): Promise<MeResponse> {
		return this.requestJson<MeResponse>("/api/auth/me");
	}

	async getOnboarding(): Promise<OnboardingState | null> {
		const response = await this.request("/api/auth/me/onboarding");
		if (!response.ok) {
			return null;
		}
		return (await response.json()) as OnboardingState;
	}

	async getPlans(): Promise<PlanSummary[]> {
		const response = await this.fetchImpl("/api/plans");
		if (!response.ok) {
			return [];
		}
		return (await response.json()) as PlanSummary[];
	}

	async getTechStackAddOns(): Promise<TechStackResponse | null> {
		const response = await this.request("/api/subscription/tech-stack-addons");
		if (!response.ok) {
			return null;
		}
		return (await response.json()) as TechStackResponse;
	}

	async updateOrganization(form: OrganizationForm): Promise<void> {
		await this.requestJson("/api/auth/me/organization", {
			method: "PUT",
			headers: DEFAULT_JSON_HEADERS,
			body: JSON.stringify(form),
		});
	}

	async updateOnboarding(payload: OnboardingUpdateRequest): Promise<void> {
		await this.requestJson("/api/auth/me/onboarding", {
			method: "PUT",
			headers: DEFAULT_JSON_HEADERS,
			body: JSON.stringify(payload),
		});
	}

	async getOrCreateSubscription(planId: string): Promise<SubscriptionSnapshot> {
		const createResponse = await this.request("/api/subscription/subscribe", {
			method: "POST",
			headers: DEFAULT_JSON_HEADERS,
			body: JSON.stringify({ planId }),
		});

		if (createResponse.ok) {
			return (await createResponse.json()) as SubscriptionSnapshot;
		}

		return this.requestJson<SubscriptionSnapshot>("/api/subscription/my-subscription");
	}

	async createOrder(payload: {
		subscriptionId: string;
		addOns: string[];
		techStack: "CUSTOM_STACK";
		stackSelections: Record<string, string>;
	}): Promise<RazorpayOrder> {
		return this.requestJson<RazorpayOrder>("/api/subscription/create-order", {
			method: "POST",
			headers: DEFAULT_JSON_HEADERS,
			body: JSON.stringify(payload),
		});
	}

	async verifyPayment(payload: RazorpayVerifyPayload): Promise<void> {
		await this.requestJson("/api/subscription/verify-payment", {
			method: "POST",
			headers: DEFAULT_JSON_HEADERS,
			body: JSON.stringify(payload),
		});
	}
}
