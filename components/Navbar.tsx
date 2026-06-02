"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DropletIcon } from "@/components/DropletIcon";
import { logout } from "@/app/actions/auth";

const mainLinks = [
  { href: "/", label: "Home" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/login", label: "Login", guestOnly: true },
  { href: "/register", label: "Register", guestOnly: true },
  { href: "/dashboard", label: "Dashboard", authOnly: true },
  { href: "/dashboard/incoming", label: "Incoming", authOnly: true },
  { href: "/dashboard/my-requests", label: "My Requests", authOnly: true },
  { href: "/dashboard/notifications", label: "Notifications", authOnly: true },
];

type NavbarProps = {
  userEmail?: string | null;
  isAdmin?: boolean;
};

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

export default function Navbar({ userEmail, isAdmin = false }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isLoggedIn = Boolean(userEmail);

  const visibleLinks = mainLinks.filter((link) => {
    if (link.authOnly) return isLoggedIn;
    if (link.guestOnly) return !isLoggedIn;
    return true;
  });

  if (isAdmin) {
    visibleLinks.push({ href: "/admin", label: "Admin Panel" });
  }

  const linkClass = (href: string) =>
    `text-sm font-medium transition-colors ${
      pathname === href
        ? "text-red-600"
        : "text-gray-600 hover:text-red-600"
    }`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-red-100 bg-white/95 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-red-600"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-200">
            <DropletIcon className="h-5 w-5" />
          </span>
          <span>
            Rokto<span className="text-gray-900">Bondhu</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {visibleLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <>
              <span className="max-w-[180px] truncate text-sm text-gray-500">
                {userEmail}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/register"
              className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-red-700"
            >
              Join as Donor
            </Link>
          )}
        </div>

        <button
          type="button"
          className="inline-flex rounded-lg p-2 text-gray-700 hover:bg-red-50 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <CloseIcon className="h-6 w-6" />
          ) : (
            <MenuIcon className="h-6 w-6" />
          )}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-red-100 bg-white px-4 py-4 md:hidden">
          <ul className="flex flex-col gap-1">
            {visibleLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`block rounded-lg px-3 py-2 ${linkClass(link.href)}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-gray-100 pt-4">
            {isLoggedIn ? (
              <>
                <p className="mb-3 truncate px-3 text-sm text-gray-500">
                  {userEmail}
                </p>
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full rounded-full border border-red-200 py-2.5 text-sm font-semibold text-red-600"
                  >
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/register"
                className="block rounded-full bg-red-600 py-2.5 text-center text-sm font-semibold text-white"
                onClick={() => setMobileOpen(false)}
              >
                Join as Donor
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
