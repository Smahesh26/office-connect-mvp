import prisma from '../src/config/prisma';
import axios from 'axios';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "OfficeConnectWebhookSecret123!";
const ACCOUNTECH_WEBHOOK_URL = process.env.ACCOUNTECH_WEBHOOK_URL || "http://localhost:4001/api/webhooks";

async function run() {
    console.log("Starting bulk sync of existing CRM Leads...");
    // Only fetch actual CRM Leads
    const leads = await prisma.lead.findMany({
        include: { contact: true }
    });

    console.log(`Found ${leads.length} actual CRM Leads in OfficeConnect.`);

    let successCount = 0;
    for (const lead of leads) {
        if (!lead.contact) continue;
        const contact = lead.contact;
        try {
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
                    timeout: 5000
                }
            );
            successCount++;
        } catch (err: any) {
            console.error(`Failed to sync lead ${lead.id}:`, err.message);
        }
    }

    console.log(`Successfully synced ${successCount} out of ${leads.length} CRM Leads.`);
    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
