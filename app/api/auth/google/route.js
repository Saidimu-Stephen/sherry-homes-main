/** @format */

import { NextResponse } from "next/server";

export async function GET() {
  const configured = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      (process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRETE)
  );

  return NextResponse.json({
    configured,
    provider: "google",
    signInEndpoint: "/api/auth/signin/google",
    callbackPath: "/api/auth/callback/google",
  });
}
