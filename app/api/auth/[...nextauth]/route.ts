import { prismaClient } from "@/app/lib/db";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "SCMT Log In",
      credentials: {
        email: { label: "email", type: "text", placeholder: "Email" },
        password: { label: "password", type: "password", placeholder: "Password" }
      },
      async authorize(credentials: any) {
        const user = await prismaClient.user.findUnique({
          where: { email: credentials.email },
        });

        if (user && await bcrypt.compare(credentials.password, user.hashedPassword)) {
          // Optionally, you can ensure the role matches allowed values
          // (user.role as Role) guarantees type
          return {
            id: user.id,
            email: user.email,
            role: user.role as Role,   // <-- USE user.role, CAST AS Role TYPE
            firstName: user.firstName,
            lastName: user.lastName,
          };
        }
        return null;
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role as Role;   // Attach actual user's role to token
        token.id = user.id;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as Role;     // Attach to session.user
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
