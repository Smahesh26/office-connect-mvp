import axios from "axios";

// In production, this should be in an environment variable
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "OfficeConnectWebhookSecret123!";
const ACCOUNTECH_WEBHOOK_URL = process.env.ACCOUNTECH_WEBHOOK_URL || "http://localhost:4001/api/webhooks";

/**
 * Sends contact details to Accountech via Webhook
 */
export const syncContactToAccountech = async (contact: any) => {
	try {
		// Only sync CUSTOMER type contacts
		if (contact.type !== "CUSTOMER") {
			return;
		}

		console.log(`[Webhook] Syncing contact ${contact.id} to Accountech...`);
		
		await axios.post(
			`${ACCOUNTECH_WEBHOOK_URL}/officeconnect/customer`,
			{
				firstName: contact.firstName,
				lastName: contact.lastName,
				email: contact.email,
				phone: contact.phone,
				companyName: contact.companyName,
			},
			{
				headers: {
					"x-webhook-secret": WEBHOOK_SECRET,
				},
				timeout: 5000 // Don't hang forever
			}
		);
		console.log(`[Webhook] Successfully synced contact ${contact.id} to Accountech.`);
	} catch (error: any) {
		console.error(`[Webhook Error] Failed to sync contact to Accountech:`, error.message);
	}
};
