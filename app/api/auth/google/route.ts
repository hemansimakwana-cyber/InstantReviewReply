import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { setSession } from "@/lib/session";
import { buildAuthUrl, isMock } from "@/lib/google";

// FR-1: "Connect Google Shop" starts here.
export async function GET(req: NextRequest) {
  const back = (msg: string) =>
    NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(msg)}`, req.url));

  try {
    // Demo mode: skip Google and sign in as a demo manager.
    if (isMock()) {
      const { data, error } = await supabase
        .from("users")
        .upsert({ email: "demo@replymesh.local", name: "Demo Manager" }, { onConflict: "email" })
        .select("id")
        .single();
      if (error || !data) throw new Error(error?.message ?? "Database error.");
      setSession(data.id);
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URI) {
      return back(
        "Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI, or use MOCK_GOOGLE=true."
      );
    }

    const state = crypto.randomBytes(16).toString("hex");
    const res = NextResponse.redirect(buildAuthUrl(state));
    res.cookies.set("rm_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 600,
    });
    return res;
  } catch (e) {
    return back(e instanceof Error ? e.message : "Sign-in failed.");
  }
}