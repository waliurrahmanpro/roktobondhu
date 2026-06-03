import Link from "next/link";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { AuthPageShell, AuthFooterLink } from "@/components/AuthForm";

export const metadata = {
  title: "Forgot password — Blood Bridge BD",
};

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm">
        <AuthFooterLink
          text="Remember your password?"
          href="/login"
          linkText="Log in"
        />
      </p>
      <p className="mt-4 text-center">
        <Link href="/" className="text-sm text-gray-500 hover:text-red-600">
          ← Back to home
        </Link>
      </p>
    </AuthPageShell>
  );
}
