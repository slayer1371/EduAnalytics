import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Only initialize Redis if credentials are provided in the environment.
// This prevents Next.js builds from crashing if variables aren't present during the build step.
const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

const redis = (redisUrl && redisToken) ? new Redis({
  url: redisUrl,
  token: redisToken,
}) : null;

// Define specific rate limit buckets
// 1. Strict limit for authentication routes to prevent brute-forcing
const authRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
}) : null;

// 2. Strict limit for AI routes to protect API usage / costs
const aiRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
}) : null;

// 3. Generous limit for all other API routes
const genericApiRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '10 s'),
  analytics: true,
}) : null;

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // We only care about rate limiting actual API routes
  if (path.startsWith('/api/')) {
    // Graceful degradation: if Redis isn't configured, skip rate limiting
    if (!redis) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Upstash Redis not configured, skipping rate limiting for', path);
      }
      return NextResponse.next();
    }

    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
    let rateLimitResult;

    // Apply specific rate limits based on the route
    if (path.startsWith('/api/auth/register')) {
      rateLimitResult = await authRateLimit!.limit(`ratelimit_auth_${ip}`);
    } else if (path.startsWith('/api/ai/')) {
      rateLimitResult = await aiRateLimit!.limit(`ratelimit_ai_${ip}`);
    } else {
      rateLimitResult = await genericApiRateLimit!.limit(`ratelimit_api_${ip}`);
    }

    // If rate limit is exceeded, return 429 Too Many Requests
    if (!rateLimitResult.success) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too Many Requests', 
          message: 'Rate limit exceeded. Please try again later.' 
        }),
        { 
          status: 429, 
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          }
        }
      );
    }
  }

  return NextResponse.next();
}

// Ensure middleware only runs on API routes to avoid unnecessary overhead on static assets/pages
export const config = {
  matcher: '/api/:path*',
}
