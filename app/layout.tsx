import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { NotificationToast } from "@/components/NotificationToast";
import { getUserRole, hasAdminAccess, hasSuperAdminAccess } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blood Bridge BD — Blood Donation Platform",
  description:
    "Find blood donors and post emergency requests across Bangladesh.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user ? await getUserRole(user.id) : null;
  const isAdmin = hasAdminAccess(role);
  const isSuperAdmin = hasSuperAdminAccess(role);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <Navbar
          userEmail={user?.email ?? null}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
        />
        <NotificationToast />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
