import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  
  // Allow Cron Jobs to bypass Basic Auth
  if (request.nextUrl.pathname.startsWith('/api/performance')) {
    const authHeader = request.headers.get('authorization');
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      return NextResponse.next();
    }
  }

  // Define credentials (fallback to defaults if not set in .env)
  const user = process.env.ADMIN_USER || 'admin';
  const pass = process.env.ADMIN_PASSWORD || 'admin';

  // Extract the Authorization header
  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    // Decode the Base64 encoded 'Basic <token>'
    const authValue = authHeader.split(' ')[1];
    // Check if it's Basic Auth
    if (!authValue.startsWith('Bearer')) {
        try {
            const [u, p] = atob(authValue).split(':');
            // Check credentials
            if (u === user && p === pass) {
              return NextResponse.next();
            }
        } catch (e) {
            // Invalid base64
        }
    }
  }

  // If no auth or incorrect, return 401 to prompt browser login
  return new NextResponse('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

// Apply middleware to all routes except public assets and API endpoints used by external services (if any)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) -> Wait, do we want to protect API routes? Usually YES for internal dashboard.
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
