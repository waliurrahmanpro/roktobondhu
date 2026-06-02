import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Profile" },
  { href: "/dashboard/incoming", label: "Incoming requests" },
  { href: "/dashboard/my-requests", label: "My requests" },
  { href: "/dashboard/my-donations", label: "My donations" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/requests", label: "Public blood need" },
];

type DashboardNavProps = {
  currentPath: string;
  unreadCount?: number;
};

export function DashboardNav({ currentPath, unreadCount = 0 }: DashboardNavProps) {
  return (
    <nav className="mb-8 flex flex-wrap gap-2">
      {links.map((link) => {
        const active = currentPath === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-red-600 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:border-red-200 hover:text-red-600"
            }`}
          >
            {link.label}
            {link.href === "/dashboard/notifications" && unreadCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
