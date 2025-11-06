declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: "USER" | "ADMIN" | "SUBCOMMITTEE";
        sessionId?: string;
      };
    }
  }
}

export {};
