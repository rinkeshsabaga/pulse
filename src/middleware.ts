import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────────────────────
// Route Definitions
// ─────────────────────────────────────────────────────────────────────────────

const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/signup(.*)',
  '/api/webhooks/stripe(.*)',      // Stripe webhooks — no auth
  '/api/webhooks/(.*)',            // Incoming workflow triggers — validated by secret
  '/api/inngest(.*)',              // Inngest — authenticated via signing key
]);

const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)', '/api/organizations/create(.*)']);

const isDashboardRoute = createRouteMatcher([
  '/home(.*)',
  '/workflows(.*)',
  '/credentials(.*)',
  '/billing(.*)',
  '/settings(.*)',
  '/runs(.*)',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────

export default clerkMiddleware(async (auth, request) => {
  const { userId, orgId } = await auth();

  // Allow public routes through
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!userId) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect_url', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated but no org — redirect to onboarding
  // (unless they're already on the onboarding page)
  if (!orgId && !isOnboardingRoute(request)) {
    return NextResponse.redirect(new URL('/onboarding?reason=middleware', request.url));
  }

  // Dashboard routes require an org
  if (isDashboardRoute(request) && !orgId) {
    return NextResponse.redirect(new URL('/onboarding?reason=middleware_dashboard', request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Always run for API routes first
    '/(api|trpc)(.*)',
    // Skip Next.js internals and static files for page routes
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
