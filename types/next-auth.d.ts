import { Role } from "@prisma/client";
import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    firstName?: string;
    lastName?: string;
    email: string;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
      firstName?: string;
      lastName?: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    firstName?: string;
    lastName?: string;
    email: string;
  }
}
