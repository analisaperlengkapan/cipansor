/**
 * Next.js Middleware
 * Handles authentication, route protection, and role-based routing
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// User roles enum - must match backend
type UserRole = 'SUPER_ADMIN' | 'UNIT_ADMIN' | 'TEACHER' | 'STAFF' | 'STUDENT' | 'PARENT';

// Public routes that don't require authentication
const publicRoutes = ['/login', '/'];

// Role-based dashboard mapping
const roleDashboardMap: Record<UserRole, string> = {
  SUPER_ADMIN: '/dashboard',
  UNIT_ADMIN: '/dashboard',
  TEACHER: '/teacher',
  STAFF: '/staff',
  STUDENT: '/student',
  PARENT: '/parent',
};

// Role-based route access control
const roleRouteAccess: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['*'], // Access to all routes
  UNIT_ADMIN: ['/dashboard', '/students', '/classes', '/teachers', '/staff', '/finance', '/tahfidz', '/health', '/permits', '/violations', '/rewards', '/reports', '/announcements', '/settings'],
  TEACHER: ['/teacher', '/tahfidz', '/classes', '/students', '/attendance', '/announcements'],
  STAFF: ['/staff', '/students', '/health', '/permits', '/violations', '/rewards', '/finance', '/announcements'],
  STUDENT: ['/student', '/tahfidz', '/schedule', '/announcements'],
  PARENT: ['/parent'],
};

// Helper function to get auth state from cookie
function getAuthState(request: NextRequest): { isAuthenticated: boolean; role?: UserRole } {
  // Check for auth storage in cookies (set by zustand persist)
  const authStorage = request.cookies.get('auth-storage')?.value;
  
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      if (parsed.state?.isAuthenticated === true && parsed.state?.user?.role) {
        return {
          isAuthenticated: true,
          role: parsed.state.user.role as UserRole,
        };
      }
    } catch {
      // Parse error - not authenticated
    }
  }
  
  // Fallback: check for accessToken
  const token = request.cookies.get('accessToken')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (token) {
    return { isAuthenticated: true };
  }
  
  return { isAuthenticated: false };
}

// Helper function to check if role can access route
function canAccessRoute(role: UserRole, pathname: string): boolean {
  const allowedRoutes = roleRouteAccess[role];
  
  // Super admin has access to everything
  if (allowedRoutes.includes('*')) {
    return true;
  }
  
  // Check if pathname starts with any allowed route
  return allowedRoutes.some(route => pathname.startsWith(route));
}

// Helper function to get dashboard for role
function getDashboardForRole(role?: UserRole): string {
  return role ? roleDashboardMap[role] : '/dashboard';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith('/login')
  );

  // Get authentication state
  const { isAuthenticated, role } = getAuthState(request);

  // Redirect unauthenticated users to login
  if (!isPublicRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from login to their role-specific dashboard
  if (pathname === '/login' && isAuthenticated) {
    const dashboard = getDashboardForRole(role);
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // Redirect from root to appropriate page
  if (pathname === '/') {
    if (isAuthenticated) {
      const dashboard = getDashboardForRole(role);
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
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
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
