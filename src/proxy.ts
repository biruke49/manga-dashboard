import { NextRequest, NextResponse } from "next/server";

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";
}

function clearAuthCookies(response: NextResponse) {
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure,
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (pathname.startsWith("/admin") && !accessToken) {
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "x-refresh-token": refreshToken,
          },
        });

        if (refreshResponse.ok) {
          const payload = (await refreshResponse.json()) as { accessToken?: string; refreshToken?: string };

          if (payload.accessToken) {
            const response = NextResponse.next();
            const secure = request.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production";
            response.cookies.set(ACCESS_TOKEN_COOKIE, payload.accessToken, {
              path: "/",
              maxAge: 60 * 60,
              sameSite: "lax",
              secure,
            });
            if (payload.refreshToken) {
              response.cookies.set(REFRESH_TOKEN_COOKIE, payload.refreshToken, {
                path: "/",
                maxAge: 60 * 60 * 24 * 7,
                sameSite: "lax",
                secure,
              });
            }
            return response;
          }
        }
      } catch {
        // Fall through to the login redirect below.
      }
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("reason", "expired");
    const response = NextResponse.redirect(loginUrl);
    clearAuthCookies(response);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*"],
};
