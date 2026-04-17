import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database, UserRole } from "@/lib/supabase/types";

function getDashboardByRole(role: UserRole | null) {
  return role === "superadmin" ? "/admin/dashboard" : "/member/dashboard";
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value: "", ...options });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const isAuthPath = pathname.startsWith("/auth");
  const isAdminPath = pathname.startsWith("/admin");
  const isMemberPath = pathname.startsWith("/member");

  if (!user) {
    if (isAdminPath || isMemberPath) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    return response;
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  const role = ((profile as { role?: UserRole } | null)?.role ?? null) as UserRole | null;

  if (isAuthPath) {
    return NextResponse.redirect(new URL(getDashboardByRole(role), request.url));
  }

  if (isAdminPath && role !== "superadmin") {
    return NextResponse.redirect(new URL(getDashboardByRole(role), request.url));
  }

  if (isMemberPath && role !== "member") {
    return NextResponse.redirect(new URL(getDashboardByRole(role), request.url));
  }

  return response;
}

export const config = {
  matcher: ["/auth/:path*", "/admin/:path*", "/member/:path*"]
};
