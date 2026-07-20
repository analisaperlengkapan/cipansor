/**
 * Next.js Middleware
 * Handles authentication, route protection, and role-based routing
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  canAccessRoute,
  getActiveRoleCode,
  getDashboardForRole,
} from "@/lib/rbac";

// Public routes that don't require authentication.
// "/unauthorized" is the access-denied page ProtectedRoute redirects to; it
// must stay reachable for any user (otherwise RBAC would bounce them off it).
// "/public" hosts the public donation portal.
const publicRoutes = ["/login", "/", "/unauthorized", "/public"];

// Helper function to get auth state from cookie
function getAuthState(request: NextRequest): {
  isAuthenticated: boolean;
  role?: string;
} {
  // Check for auth storage in cookies (set by zustand persist)
  const authStorage = request.cookies.get("auth-storage")?.value;

  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      if (parsed.state?.isAuthenticated === true && parsed.state?.user) {
        // The active RoleCode (primary assignment) drives both route access
        // and the dashboard redirect; legacy-bucket users are mapped to a
        // representative RoleCode inside the rbac helpers.
        const role = getActiveRoleCode(parsed.state.user);
        if (role) {
          return { isAuthenticated: true, role };
        }
      }
    } catch {
      // Parse error - not authenticated
    }
  }

  // Fallback: check for accessToken
  const token =
    request.cookies.get("accessToken")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (token) {
    return { isAuthenticated: true };
  }

  return { isAuthenticated: false };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/public/"),
  );

  // Get authentication state
  const { isAuthenticated, role } = getAuthState(request);

  // Redirect unauthenticated users to login
  if (!isPublicRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from login to their role-specific dashboard
  if (pathname === "/login" && isAuthenticated) {
    const dashboard = getDashboardForRole(role);
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // Redirect from root to appropriate page
  if (pathname === "/") {
    if (isAuthenticated) {
      const dashboard = getDashboardForRole(role);
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
    // Allow unauthenticated users to see landing page
    return NextResponse.next();
  }

  // Role-based access control for authenticated users
  if (isAuthenticated && role && !isPublicRoute) {
    if (!canAccessRoute(role, pathname)) {
      // Redirect to their proper dashboard if trying to access unauthorized route
      const dashboard = getDashboardForRole(role);
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};
