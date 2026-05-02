import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/auth/reset",
  "/api/capture",
  "/onboarding",
];

export async function proxy(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !key) {
    return res; // env not set yet — let pages render fixtures
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        toSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some(
    (p) => path === p || path.startsWith(p + "/"),
  );

  if (!user && !isPublic) {
    const login = req.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  // Authed but not yet a member of any vault → onboarding.
  if (user && !isPublic && path !== "/onboarding") {
    const { data: membership } = await supabase
      .from("vault_members")
      .select("vault_id")
      .limit(1)
      .maybeSingle();
    if (!membership) {
      const onboarding = req.nextUrl.clone();
      onboarding.pathname = "/onboarding";
      return NextResponse.redirect(onboarding);
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
