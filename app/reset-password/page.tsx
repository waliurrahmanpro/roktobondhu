import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { AuthPageShell } from "@/components/AuthForm";

export const metadata = {
  title: "Reset password — RoktoBondhu",
};

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/forgot-password");
  }

  return (
    <AuthPageShell>
      <ResetPasswordForm />
      <p className="mt-6 text-center">
        <Link href="/login" className="text-sm text-gray-500 hover:text-red-600">
          ← Back to login
        </Link>
      </p>
    </AuthPageShell>
  );
}
