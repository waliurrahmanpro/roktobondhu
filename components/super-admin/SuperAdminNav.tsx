import Link from "next/link";

const links = [
  { href: "/super-admin", label: "Dashboard" },
  { href: "/super-admin/users", label: "Users" },
  { href: "/super-admin/admins", label: "Admins" },
  { href: "/super-admin/settings", label: "Settings" },
  { href: "/super-admin/announcements", label: "Announcements" },
  { href: "/super-admin/points", label: "Points" },
  { href: "/super-admin/logs", label: "Audit logs" },
];

type SuperAdminNavProps = {
  currentPath: string;
};

export function SuperAdminNav({ currentPath }: SuperAdminNavProps) {
  return (
    <nav className="mb-8 flex flex-wrap gap-2">
      {links.map((link) => {
        const active =
          currentPath === link.href ||
          (link.href !== "/super-admin" && currentPath.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-purple-900 text-white"
                : "border border-gray-200 bg-white text-gray-700 hover:border-purple-300"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
