# Architecture

## System Overview

```
┌──────────────────────────────────────────────────┐
│                    Nginx                         │
│              (reverse proxy, SSL)                │
├──────────────┬───────────────────────────────────┤
│   Frontend   │           Backend                 │
│  Next.js 16  │        Express 5                  │
│  Port 3000   │   Port 5000 / Port 4000           │
│              │                                   │
│  ┌─────────┐ │  ┌──────────────────────────────┐ │
│  │Customer │ │  │  Modules                     │ │
│  │Storefront│ │  │  ├── auth                   │ │
│  ├─────────┤ │  │  ├── ecommerce (catalog,     │ │
│  │ Seller  │ │  │  │   cart, orders, stores)   │ │
│  │ Portal  │ │  │  ├── admin                   │ │
│  ├─────────┤ │  │  ├── inventory               │ │
│  │  Admin  │ │  │  ├── crm                     │ │
│  │  Panel  │ │  │  ├── hrm                     │ │
│  └─────────┘ │  │  ├── accounting              │ │
│              │  │  ├── invoicing                │ │
│              │  │  └── ...                      │ │
│              │  └──────────────────────────────┘ │
│              │           │                       │
│              │  ┌────────▼───────────────────┐   │
│              │  │     PostgreSQL              │   │
│              │  │     (Prisma ORM)            │   │
│              │  └────────────────────────────┘   │
└──────────────┴───────────────────────────────────┘
```

## Frontend Architecture

### Route Groups
- `/(storefront)/*` — Customer-facing storefront (no sidebar)
- `/seller/*` — Seller portal (seller sidebar)
- `/admin-dashboard` — Admin panel (admin sidebar via WorkspaceShell)
- `/dashboard`, `/crm`, `/hrm`, etc. — Existing SaaS modules (WorkspaceShell)

### Component Organization
```
components/
├── ui/              # Shared primitives (Button, Input, Badge, Skeleton)
├── storefront/      # Storefront-specific components
├── seller/          # Seller portal components
└── (existing)       # WorkspaceShell, NavBar, etc.
```

### State Management
- Server state: React Query (`@tanstack/react-query`)
- UI state: React `useState` / `useReducer`
- No global state library needed at this scale

### API Communication
- Centralized API client in `lib/api.ts`
- All API calls go through `lib/api.ts` → Express backend
- Auth token passed via cookies (httpOnly JWT)

## Backend Architecture

### Module Pattern
Each backend module follows:
```
modules/<name>/
├── <name>.routes.ts      # Express router
├── <name>.controller.ts  # Request handlers (thin)
├── <name>.service.ts     # Business logic
└── <name>.types.ts       # TypeScript interfaces (optional)
```

### Key Principles
- Controllers validate input and call services
- Services contain business logic and database queries
- No Prisma calls in controllers
- No Express types in services
- Monetary values use `Decimal` (Prisma) — never floating-point

### Security Boundaries
- Customer APIs: auth required, scoped to customer's data
- Seller APIs: auth required, scoped to seller's store(s)
- Admin APIs: auth required, role check for SUPER_ADMIN/ADMIN
- Public APIs: catalog browsing, product search (no auth)

## Database
- PostgreSQL via Prisma ORM
- 70+ models covering SaaS + Marketplace domains
- See `docs/DATABASE.md` for marketplace-specific models
