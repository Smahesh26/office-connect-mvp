## Cambliss Frontend

Cambliss is a SaaS platform frontend built with Next.js App Router.

### CRM Overview

The CRM (Customer Relationship Management) module is designed as a customer-centric workspace where teams can:

- store customer and lead details in one place,
- track deals through sales pipeline stages,
- log service/support activities,
- manage marketing campaigns,
- view revenue and KPI insights,
- control integrations and operational governance.

### No-Cost CRM Mode

Cambliss CRM supports a no-cost internal-first mode.

- Core CRM workflows run on your own backend + database.
- Paid third-party APIs are optional (WhatsApp, SMS, telephony, bulk email providers).
- Teams can operate lead/deal/service workflows without external paid integrations.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

Key routes:

- `/dashboard` → Client dashboard
- `/admin-dashboard` → Admin control panel
- `/crm` → CRM suite

### CRM Quick Flow (Client)

1. Create lead in Sales Execution.
2. Click **Use in Deal** from Lead List.
3. Select contact, pipeline, stage and create deal.
4. Update deal stage and review history.
5. Use Service, Marketing, and Integrations tabs.

## Notes

- Frontend API calls are proxied via Next.js rewrites to backend origin.
- Ensure backend is running before using CRM and other API-backed modules.
