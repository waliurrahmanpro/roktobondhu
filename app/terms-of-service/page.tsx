import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-700"
          >
            ← Back to Home
          </Link>
        </div>

        <h1 className="mb-8 text-4xl font-bold text-gray-900">
          Terms of Service
        </h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              Acceptance of Terms
            </h2>
            <p className="mt-4 text-gray-600">
              By accessing and using RoktoBondhu, you agree to be bound by
              these Terms of Service. If you do not agree to these terms, please
              do not use our platform.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              Accurate Information
            </h2>
            <p className="mt-4 text-gray-600">
              Users must provide accurate, truthful, and complete information
              when registering and using the platform. This includes:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-600">
              <li>Full name and contact details</li>
              <li>Correct blood group information</li>
              <li>Valid National ID (NID) for verification</li>
              <li>Accurate location information</li>
            </ul>
            <p className="mt-4 text-gray-600">
              Providing false or misleading information may result in account
              suspension or termination.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              Prohibited Activities
            </h2>
            <p className="mt-4 text-gray-600">
              The following activities are strictly prohibited on RoktoBondhu:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-600">
              <li>
                <strong>Fake Blood Requests</strong> - Creating fraudulent or
                non-existent blood requests
              </li>
              <li>
                <strong>Abuse and Harassment</strong> - Using the platform to
                harass, threaten, or abuse other users
              </li>
              <li>
                <strong>Spam</strong> - Sending unsolicited messages or creating
                fake accounts
              </li>
              <li>
                <strong>Fraudulent Activity</strong> - Attempting to deceive
                other users or the platform for personal gain
              </li>
              <li>
                <strong>Commercial Exploitation</strong> - Using the platform for
                commercial purposes without authorization
              </li>
              <li>
                <strong>Unauthorized Access</strong> - Attempting to access
                other users' accounts or data
              </li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              Account Suspension and Termination
            </h2>
            <p className="mt-4 text-gray-600">
              RoktoBondhu reserves the right to suspend or terminate user
              accounts that violate these Terms of Service, including but not
              limited to:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-600">
              <li>Repeated violations of community guidelines</li>
              <li>Fraudulent or malicious activity</li>
              <li>Providing false information</li>
              <li>Abuse of other users or the platform</li>
            </ul>
            <p className="mt-4 text-gray-600">
              Super Admins have the authority to suspend or remove accounts that
              violate these rules. Suspended users may appeal the decision
              through the Contact page.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              Platform Purpose and Limitations
            </h2>
            <p className="mt-4 text-gray-600">
              RoktoBondhu is a platform designed to connect blood donors with
              recipients. Important limitations:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-600">
              <li>
                RoktoBondhu does not guarantee medical outcomes or successful
                blood donations
              </li>
              <li>
                The platform facilitates connections but does not provide medical
                advice
              </li>
              <li>
                Users should verify donor eligibility and medical requirements
                independently
              </li>
              <li>
                Blood donation should only occur at licensed medical facilities
              </li>
              <li>
                RoktoBondhu is not responsible for interactions between donors
                and recipients outside the platform
              </li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              User Responsibilities
            </h2>
            <p className="mt-4 text-gray-600">
              As a user of RoktoBondhu, you agree to:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-600">
              <li>Respond promptly to blood requests you accept</li>
              <li>Honor your commitments to donate</li>
              <li>Respect the privacy and dignity of other users</li>
              <li>Report suspicious or fraudulent activity</li>
              <li>Keep your contact information up to date</li>
              <li>Follow all applicable laws and regulations</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              Privacy and Data Protection
            </h2>
            <p className="mt-4 text-gray-600">
              Your use of RoktoBondhu is also governed by our{" "}
              <Link
                href="/privacy-policy"
                className="text-red-600 hover:text-red-700"
              >
                Privacy Policy
              </Link>
              . Please review our Privacy Policy to understand how we collect,
              use, and protect your personal information.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              Modifications to Terms
            </h2>
            <p className="mt-4 text-gray-600">
              RoktoBondhu reserves the right to modify these Terms of Service at
              any time. Continued use of the platform after changes constitutes
              acceptance of the updated terms.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              Contact Us
            </h2>
            <p className="mt-4 text-gray-600">
              If you have any questions about these Terms of Service, please
              contact us through our{" "}
              <Link href="/contact" className="text-red-600 hover:text-red-700">
                Contact page
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
