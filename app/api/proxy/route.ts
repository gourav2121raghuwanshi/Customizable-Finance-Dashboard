import { NextRequest, NextResponse } from "next/server";

// Rate limiting tracking (simple in-memory store)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 50; // Adjust based on API limits

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (limit.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  limit.count++;
  return true;
}

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // Get client IP for rate limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: 60 
        },
        { status: 429 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Finance-Dashboard/1.0",
        },
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return NextResponse.json(
          { 
            error: `API returned ${res.status}: ${res.statusText}`,
            status: res.status 
          },
          { status: res.status }
        );
      }

      const data = await res.json();

      // Check for API-specific error responses
      if (data["Error Message"] || data["Note"]) {
        return NextResponse.json(
          { 
            error: data["Error Message"] || data["Note"] || "API returned an error",
            apiError: true 
          },
          { status: 400 }
        );
      }

      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        return NextResponse.json({ error: "Request timeout" }, { status: 408 });
      }
      throw fetchError;
    }
  } catch (err: any) {
    console.error("Proxy error:", err);
    return NextResponse.json(
      { 
        error: err.message || "Failed to fetch API",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined
      },
      { status: 500 }
    );
  }
}
