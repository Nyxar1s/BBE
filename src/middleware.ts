import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN = "/admin/login";

/**
 * Runs on every /admin request:
 *  - refreshes the Supabase session cookie,
 *  - sends signed-out visitors to the login page,
 *  - signs out accounts the dashboard rejected as non-admins.
 * The admin check itself lives in requireAdmin() (src/lib/auth.ts).
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const path = request.nextUrl.pathname;
  const isLogin = path === LOGIN;

  if (!url || !key) {
    return isLogin ? NextResponse.next() : NextResponse.redirect(new URL(LOGIN, request.url));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isLogin) {
    return redirectKeepingCookies(new URL(LOGIN, request.url), response);
  }

  if (user && isLogin) {
    if (request.nextUrl.searchParams.get("reason") === "unauthorized") {
      await supabase.auth.signOut();
      return response;
    }
    return redirectKeepingCookies(new URL("/admin", request.url), response);
  }

  return response;
}

function redirectKeepingCookies(to: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(to);
  from.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}

export const config = {
  matcher: ["/admin/:path*"],
};
