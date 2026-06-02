import Link from "next/link";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/verifications", label: "Verifications" },
  { href: "/admin/requests", label: "Blood requests" },
  { href: "/admin/analytics", label: "Analytics" },
];

type AdminNavProps = {
  currentPath: string;
};

export function AdminNav({ currentPath }: AdminNavProps) {
  return (
    <nav className="mb-8 flex flex-wrap gap-2">
      {links.map((link) => {
        const active =
          currentPath === link.href ||
          (link.href !== "/admin" && currentPath.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-gray-900 text-white"
                : "border border-gray-200 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
