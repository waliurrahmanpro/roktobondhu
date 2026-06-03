import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";
import { isLoginBlocked } from "@/lib/moderation";
import type { UserRole } from "@/lib/types/database";

function hasAdminAccess(role: UserRole | null | undefined) {
  return role === "admin" || role === "super_admin";
}

function isSuperAdmin(role: UserRole | null | undefined) {
  return role === "super_admin";
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const { data: siteSettings } = await supabase
    .from("site_settings")
    .select("maintenance_mode, registration_enabled")
    .eq("id", 1)
    .maybeSingle();

  const maintenanceMode = siteSettings?.maintenance_mode ?? false;

  let userRole: UserRole | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_banned, is_blacklisted, role")
      .eq("user_id", user.id)
      .maybeSingle();

    userRole = (profile?.role as UserRole) ?? "user";

    if (isLoginBlocked(profile ?? undefined)) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("banned", "1");
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/super-admin")) {
    if (!user || !isSuperAdmin(userRole)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!user || !hasAdminAccess(userRole)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  if (
    maintenanceMode &&
    !pathname.startsWith("/super-admin") &&
    pathname !== "/maintenance" &&
    !pathname.startsWith("/_next") &&
    pathname !== "/login"
  ) {
    if (!isSuperAdmin(userRole)) {
      const url = request.nextUrl.clone();
      url.pathname = "/maintenance";
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/register" && siteSettings?.registration_enabled === false) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("registration", "closed");
    return NextResponse.redirect(url);
  }

  if (!user && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (
    user &&
    (pathname === "/login" || pathname === "/register")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
