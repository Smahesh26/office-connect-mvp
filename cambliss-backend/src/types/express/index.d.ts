import type { RoleName } from "../../generated/prisma/enums";

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
