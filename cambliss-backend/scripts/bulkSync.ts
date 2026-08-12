import prisma from '../src/config/prisma';
import axios from 'axios';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "OfficeConnectWebhookSecret123!";
const ACCOUNTECH_WEBHOOK_URL = process.env.ACCOUNTECH_WEBHOOK_URL || "http://localhost:4001/api/webhooks";

async function run() {
    console.log("Starting bulk sync of existing customers...");
    const customers = await prisma.contact.findMany({
        where: { type: 'CUSTOMER' }
    });

    console.log(`Found ${customers.length} existing customers in OfficeConnect.`);

    let successCount = 0;
    for (const contact of customers) {
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
            console.error(`Failed to sync contact ${contact.id}:`, err.message);
        }
    }

    console.log(`Successfully synced ${successCount} out of ${customers.length} customers.`);
    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
