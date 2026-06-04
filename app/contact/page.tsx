"use client";

import { useFormState } from "react-dom";
import Link from "next/link";

type FormState = {
  success?: string;
  error?: string;
};

function ContactForm() {
  const [state, formAction] = useFormState<FormState, FormData>(
    async (_prev: FormState, formData: FormData) => {
      // Placeholder - no backend integration required
      const name = formData.get("name");
      const email = formData.get("email");
      const subject = formData.get("subject");
      const message = formData.get("message");

      if (!name || !email || !subject || !message) {
        return { error: "All fields are required." };
      }

      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return { success: "Message sent successfully! We'll get back to you soon." };
    },
    {}
  );

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-red-500"
          placeholder="Your full name"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-red-500"
          placeholder="your.email@example.com"
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
          Subject
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-red-500"
          placeholder="How can we help?"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-red-500"
          placeholder="Tell us more about your inquiry..."
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600">{state.success}</p>
      )}

      <button
        type="submit"
        className="w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700"
      >
        Send Message
      </button>
    </form>
  );
}

export default function ContactPage() {
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

        <h1 className="mb-8 text-4xl font-bold text-gray-900">Contact Us</h1>

        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              Get in Touch
            </h2>
            <p className="mb-6 text-gray-600">
              Have questions, feedback, or need support? We'd love to hear from
              you. Fill out the form and we'll get back to you as soon as
              possible.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <svg
                  className="mt-1 h-5 w-5 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <p className="text-gray-600">support@roktobondhu.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg
                  className="mt-1 h-5 w-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Facebook</p>
                  <p className="text-gray-600">facebook.com/roktobondhu</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
