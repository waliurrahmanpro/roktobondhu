import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditBloodRequestForm } from "@/components/EditBloodRequestForm";
import { canManageBloodRequest } from "@/lib/blood-request-access";
import { fetchBloodRequestForViewer } from "@/lib/data/blood-requests";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const request = await fetchBloodRequestForViewer(id, user?.id ?? null);
  return {
    title: request
      ? `Edit ${request.blood_group} request — RoktoBondhu`
      : "Edit request — RoktoBondhu",
  };
}

export default async function EditBloodRequestPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/requests/${id}/edit`);
  }

  const request = await fetchBloodRequestForViewer(id, user.id);
  if (!request) {
    notFound();
  }

  if (!(await canManageBloodRequest(user.id, request))) {
    notFound();
  }

  if (request.status === "removed") {
    redirect("/dashboard/requests");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white pt-28 pb-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <Link
          href={`/requests/${id}`}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          ← Back to request
        </Link>

        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          Edit blood request
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Update patient and hospital details. Changes are logged in the audit
          trail.
        </p>

        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-lg shadow-gray-100">
          <EditBloodRequestForm request={request} />
        </div>
      </div>
    </div>
  );
}
