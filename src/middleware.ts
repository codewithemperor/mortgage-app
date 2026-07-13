import { NextResponse, type NextRequest } from "next/server";
import { verifyBorrowerToken, COOKIE_NAME } from "@/lib/portal-auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow auth API routes and static assets
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Allow borrower auth API (login/logout don't need JWT check)
  if (pathname === "/api/borrower/auth" && (req.method === "POST" || req.method === "DELETE")) {
    return NextResponse.next();
  }

  // --- BORROWER ROUTES ---
  const isBorrowerRoute = pathname.startsWith("/borrower");

  if (isBorrowerRoute) {
    const isBorrowerLogin = pathname === "/borrower/login";
    const borrowerToken = req.cookies.get(COOKIE_NAME)?.value;
    const isBorrowerLoggedIn = !!borrowerToken;

    // Verify the JWT is not expired
    if (isBorrowerLoggedIn) {
      const payload = await verifyBorrowerToken(borrowerToken);
      if (!payload) {
        // Token expired or invalid — clear cookie and treat as logged out
        const res = NextResponse.redirect(new URL("/borrower/login", req.url));
        res.cookies.delete(COOKIE_NAME);
        return res;
      }
    }

    // Borrower login page is always public
    if (isBorrowerLogin) {
      if (isBorrowerLoggedIn) {
        return NextResponse.redirect(new URL("/borrower/dashboard", req.url));
      }
      return NextResponse.next();
    }

    // Protect all other borrower routes
    if (!isBorrowerLoggedIn) {
      return NextResponse.redirect(new URL("/borrower/login", req.url));
    }

    return NextResponse.next();
  }

  // --- ADMIN / STAFF ROUTES ---
  const sessionCookie =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;

  const isLoggedIn = !!sessionCookie;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname.startsWith("/admin/login");

  if (isAdminRoute) {
    if (isLoginPage) {
      if (isLoggedIn) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
      return NextResponse.next();
    }

    // Protect all other /admin routes
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
