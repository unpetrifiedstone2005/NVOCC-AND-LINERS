// app/main/book/createbooking/layout.tsx
import { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Create Booking",
};

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    // redirect to your login page, preserving the callback URL
    redirect(
      `/auth/login?callbackUrl=${encodeURIComponent(
        "/main/book/createbooking"
      )}`
    );
  }

  return <>{children}</>;
}
