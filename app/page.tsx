import Link from "next/link";
import { DropletIcon } from "@/components/DropletIcon";
import { BloodRequestFeed } from "@/components/BloodRequestFeed";
import { BLOOD_GROUPS } from "@/lib/constants";
import { fetchPublicBloodRequests } from "@/lib/data/fetch-blood-requests";

const stats = [
  { value: "12,500+", label: "Registered Donors" },
  { value: "8,200+", label: "Lives Saved" },
  { value: "64", label: "Districts Covered" },
  { value: "24/7", label: "Emergency Support" },
];

export default async function Home() {
  const bloodRequests = await fetchPublicBloodRequests();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <main>
        {/* Hero */}
        <section
          id="home"
          className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-red-800 pt-28 pb-20 text-white sm:pt-32 sm:pb-28"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            aria-hidden
          >
            <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-red-300 blur-3xl" />
          </div>

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                Bangladesh&apos;s trusted blood network
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Donate blood.
                <br />
                <span className="text-red-100">Save a life today.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-red-100/90">
                RoktoBondhu connects patients in need with verified blood
                donors across Bangladesh — fast, free, and always ready for
                emergencies.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <a
                  href="#search"
                  className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-base font-bold text-red-600 shadow-xl transition hover:bg-red-50"
                >
                  Find a Donor
                </a>
                <a
                  href="#requests"
                  className="inline-flex items-center justify-center rounded-full border-2 border-white/80 px-8 py-3.5 text-base font-bold text-white transition hover:bg-white/10"
                >
                  View requests
                </a>
              </div>
              <div className="mt-10 flex flex-wrap gap-6 text-sm text-red-100">
                <span className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Verified donors
                </span>
                <span className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  100% free platform
                </span>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-red-600">
                    <DropletIcon className="h-9 w-9" />
                  </div>
                  <div>
                    <p className="text-sm text-red-100">Active requests</p>
                    <p className="text-3xl font-bold">47</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {["O+", "B+", "A+"].map((group, i) => (
                    <div
                      key={group}
                      className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3"
                    >
                      <span className="font-semibold">{group}</span>
                      <span className="text-sm text-red-100">
                        {["Dhaka", "Chittagong", "Sylhet"][i]} · Urgent
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Donor Search */}
        <section id="search" className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-red-600">
                Search donors
              </span>
              <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
                Find blood donors near you
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-gray-600">
                Filter by blood group and location to connect with available
                donors in your area.
              </p>
            </div>

            <form
              className="mx-auto mt-12 max-w-4xl rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-100 sm:p-8"
            >
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label
                    htmlFor="blood-group"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Blood group
                  </label>
                  <select
                    id="blood-group"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select group
                    </option>
                    {BLOOD_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="district"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    District
                  </label>
                  <input
                    id="district"
                    type="text"
                    placeholder="e.g. Dhaka"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="area"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Area / Thana
                  </label>
                  <input
                    id="area"
                    type="text"
                    placeholder="e.g. Mirpur"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </div>
                <div className="flex items-end sm:col-span-2 lg:col-span-1">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-red-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-red-700"
                  >
                    Search Donors
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: "Rahim Uddin",
                  group: "O+",
                  location: "Mirpur, Dhaka",
                  last: "2 days ago",
                },
                {
                  name: "Fatima Khan",
                  group: "A+",
                  location: "Agrabad, Chittagong",
                  last: "1 week ago",
                },
                {
                  name: "Karim Hassan",
                  group: "B+",
                  location: "Zindabazar, Sylhet",
                  last: "3 days ago",
                },
              ].map((donor) => (
                <article
                  key={donor.name}
                  className="rounded-2xl border border-gray-100 p-6 transition hover:border-red-200 hover:shadow-lg hover:shadow-red-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-lg font-bold text-red-600">
                      {donor.group}
                    </div>
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                      Available
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-gray-900">
                    {donor.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{donor.location}</p>
                  <p className="mt-3 text-xs text-gray-400">
                    Last donated: {donor.last}
                  </p>
                  <button
                    type="button"
                    className="mt-4 w-full rounded-lg border border-red-200 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Contact Donor
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <BloodRequestFeed requests={bloodRequests} />

        {/* Statistics */}
        <section id="impact" className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-red-600">
                Our impact
              </span>
              <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
                Together we save lives
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-gray-600">
                Real numbers from a community that believes every drop of blood
                matters.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="group rounded-2xl border border-red-100 bg-gradient-to-b from-white to-red-50/50 p-8 text-center transition hover:border-red-200 hover:shadow-lg hover:shadow-red-50"
                >
                  <p className="text-4xl font-extrabold text-red-600 sm:text-5xl">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-16 rounded-2xl bg-red-600 px-8 py-12 text-center text-white sm:px-12">
              <h3 className="text-2xl font-bold sm:text-3xl">
                Become a lifesaver today
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-red-100">
                Register as a donor and join thousands of heroes making
                Bangladesh safer, one donation at a time.
              </p>
              <Link
                href="/register"
                className="mt-8 inline-flex rounded-full bg-white px-8 py-3.5 font-bold text-red-600 shadow-xl transition hover:bg-red-50"
              >
                Register as Donor
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <a
                href="#home"
                className="flex items-center gap-2 text-xl font-bold text-red-600"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white">
                  <DropletIcon className="h-4 w-4" />
                </span>
                RoktoBondhu
              </a>
              <p className="mt-4 max-w-xs text-sm text-gray-600">
                Connecting blood donors with those in need across Bangladesh.
                Free, fast, and built for emergencies.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Platform</h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#search" className="hover:text-red-600">
                    Find Donor
                  </a>
                </li>
                <li>
                  <a href="#requests" className="hover:text-red-600">
                    Blood requests
                  </a>
                </li>
                <li>
                  <Link href="/dashboard/requests" className="hover:text-red-600">
                    Create request
                  </Link>
                </li>
                <li>
                  <a href="#impact" className="hover:text-red-600">
                    Our Impact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Support</h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-red-600">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-red-600">
                    Safety guidelines
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-red-600">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Contact</h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>support@roktobondhu.org</li>
                <li>+880 1XXX-XXXXXX</li>
                <li>Dhaka, Bangladesh</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 sm:flex-row">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} RoktoBondhu. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-red-600">
                Privacy
              </a>
              <a href="#" className="hover:text-red-600">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
