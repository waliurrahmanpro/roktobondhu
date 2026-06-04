import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-sm text-gray-600">
            © {new Date().getFullYear()} RoktoBondhu. All rights reserved.
          </div>

          <nav className="flex flex-wrap justify-center gap-6 md:justify-end">
            <Link
              href="/privacy-policy"
              className="text-sm text-gray-600 hover:text-red-600"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-sm text-gray-600 hover:text-red-600"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="text-sm text-gray-600 hover:text-red-600"
            >
              Contact Us
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
