import { NextResponse } from "next/server";
import { clearCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(clearCookie("app_session"));
  response.cookies.set(clearCookie("oidc_pkce"));
  return response;
}
