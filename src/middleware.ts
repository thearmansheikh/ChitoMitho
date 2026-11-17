import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  // The sign-in page and the reset page (opened from the emailed link) must be reachable while signed out.
  const isPublic = req.nextUrl.pathname === "/admin/login" || req.nextUrl.pathname === "/admin/reset-password";

  if (!isPublic) {
    const login = req.nextUrl.clone();
    login.pathname = "/admin/login";
    login.search = "";
    if (!user) return NextResponse.redirect(login);
    // RLS lets a user read only their own admins row.
    const { data: admin } = await supabase.from("admins").select("user_id").maybeSingle();
    if (!admin) {
      login.search = "?error=not-admin";
      return NextResponse.redirect(login);
    }
  }
  return res;
}

export const config = { matcher: ["/admin/:path*"] };
