import { type NextRequest } from "next/server"

import {
  redirectWithCookies,
  updateSession,
} from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/welcome") && !user) {
    return redirectWithCookies(request, "/login", response)
  }

  return response
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/welcome/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
