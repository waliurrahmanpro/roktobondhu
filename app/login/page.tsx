import Link from "next/link";
import { login } from "@/app/actions/auth";
import {
  AuthForm,
  AuthPageShell,
  AuthFooterLink,
} from "@/components/AuthForm";

export const metadata = {
  title: "Login — RoktoBondhu",
};

type LoginPageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect: redirectTo } = await searchParams;

  return (
    <AuthPageShell>
      <AuthForm
        title="Welcome back"
        subtitle="Sign in to request blood from donors or manage your profile."
        submitLabel="Log in"
        action={login}
        redirectTo={redirectTo}
        footer={
          <AuthFooterLink
            text="Don't have an account?"
            href="/register"
            linkText="Register"
          />
        }
      />
      <p className="mt-6 text-center">
        <Link href="/" className="text-sm text-gray-500 hover:text-red-600">
          ← Back to home
        </Link>
      </p>
    </AuthPageShell>
  );
}
