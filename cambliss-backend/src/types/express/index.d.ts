import type { RoleName } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        organizationId: string;
        role: RoleName;
      };
    }
  }
}

export {};
