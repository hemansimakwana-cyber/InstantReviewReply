import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { setSession } from "@/lib/session";
import { exchangeCode, getUserInfo } from "@/lib/google";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const back = (msg: string) =>
    NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(msg)}`, req.url));

  if (url.searchParams.get("error")) return back("Google sign-in was cancelled or denied.");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = req.cookies.get("rm_oauth_state")?.value;
  if (!code || !state || state !== savedState) return back("Invalid OAuth state. Please try again.");

  try {
    // 1. Exchange the code for tokens
    const tokens = await exchangeCode(code);
    const info = await getUserInfo(tokens.access_token);

    // 2. Upsert the user
    const { data: user, error: userErr } = await supabase
      .from("users")
      .upsert({ email: info.email, name: info.name ?? null }, { onConflict: "email" })
      .select("id")
      .single();
    if (userErr || !user) throw new Error(userErr?.message ?? "Could not save user.");

    // 3. Store connection tokens (keep the old refresh token if Google didn't send a new one)
    const row: Record<string, unknown> = {
      user_id: user.id,
      access_token: tokens.access_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      scope: tokens.scope,
      updated_at: new Date().toISOString(),
    };
    if (tokens.refresh_token) row.refresh_token = tokens.refresh_token;

    const { error: connErr } = await supabase
      .from("google_connections")
      .upsert(row, { onConflict: "user_id" });
    if (connErr) throw new Error(connErr.message);

    // 4. Sign the user in
    setSession(user.id);
    const res = NextResponse.redirect(new URL("/dashboard", req.url));
    res.cookies.delete("rm_oauth_state");
    return res;
  } catch (e) {
    return back(e instanceof Error ? e.message : "Google connection failed.");
  }
}