import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

export async function POST(request) {
  const res = NextResponse.redirect(new URL("/login", request.url), 303);
  res.cookies.delete(COOKIE_NAME);
  return res;
}
