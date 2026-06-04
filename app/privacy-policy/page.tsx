import Link from "next/link";

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              Information We Collect
            </h2>
            <p className="mt-4 text-gray-600">
              RoktoBondhu collects the following personal information to
              facilitate blood donation matching and identity verification:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-600">
              <li>
                <strong>Full Name</strong> - To identify donors and recipients
              </li>
              <li>
                <strong>Phone Number</strong> - To contact donors and recipients
                for blood requests
              </li>
              <li>
                <strong>Email Address</strong> - For account management and
                notifications
              </li>
              <li>
                <strong>Date of Birth</strong> - To verify donor eligibility
                (must be 18-65 years old)
              </li>
              <li>
                <strong>NID Images</strong> - For identity verification purposes
                only
              </li>
              <li>
                <strong>Blood Group</strong> - To match donors with recipients
              </li>
              <li>
                <strong>Location</strong> - Division, District, and Upazila for
                proximity-based matching
              </li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              How We Use Your Information
            </h2>
            <p className="mt-4 text-gray-600">
              Your information is used for the following purposes:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-600">
              <li>
                Matching blood donors with recipients based on blood group and
                location
              </li>
              <li>
                Verifying donor identity through NID document review
              </li>
              <li>
                Sending notifications about blood requests, donation
                opportunities, and platform updates
              </li>
              <li>
                Maintaining donor eligibility records (age, donation history,
                cooldown periods)
              </li>
              <li>Facilitating communication between donors and recipients</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              NID Document Handling
            </h2>
            <p className="mt-4 text-gray-600">
              National ID (NID) documents uploaded for identity verification are:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-600">
              <li>
                Stored securely in a private storage bucket with restricted
                access
              </li>
              <li>
                Reviewed only by authorized administrators for verification
                purposes
              </li>
              <li>
                Never shared with third parties or used for purposes other than
                identity verification
              </li>
              <li>
                Deleted upon account deletion or upon user request
              </li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              Data Security
            </h2>
            <p className="mt-4 text-gray-600">
              We implement appropriate technical and organizational measures to
              protect your personal data, including:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-600">
              <li>Encryption of data in transit and at rest</li>
              <li>Role-based access controls</li>
              <li>Regular security audits</li>
              <li>Secure authentication mechanisms</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              Account Deletion
            </h2>
            <p className="mt-4 text-gray-600">
              You have the right to request deletion of your account and all
              associated personal data. To request account deletion:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-600">
              <li>Contact us through the Contact page</li>
              <li>
                Provide your registered email address and reason for deletion
              </li>
              <li>
                We will process your request within 30 days and confirm deletion
              </li>
            </ul>
            <p className="mt-4 text-gray-600">
              Note: Some data may be retained for legal or regulatory purposes
              even after account deletion.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              Contact Us
            </h2>
            <p className="mt-4 text-gray-600">
              If you have any questions about this Privacy Policy or how we
              handle your data, please contact us through our{" "}
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
