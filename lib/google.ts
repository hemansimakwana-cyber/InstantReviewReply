import { supabase } from "@/lib/supabase";

const STAR: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

export const isMock = () => process.env.MOCK_GOOGLE === "true";

export interface SyncedReview {
  reviewName: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createTime: string;
  replyComment: string | null;
  replyTime: string | null;
}

export interface GoogleLocation {
  accountName: string;
  locationName: string;
  title: string;
}

/* ------------------------------ OAuth 2.0 ------------------------------ */

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? "",
    response_type: "code",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/business.manage",
    ].join(" "),
    access_type: "offline", // gives us a refresh token
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? "",
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  return (await res.json()) as TokenResponse;
}

export async function getUserInfo(
  accessToken: string
): Promise<{ sub: string; email: string; name?: string }> {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Could not read Google profile.");
  return (await res.json()) as { sub: string; email: string; name?: string };
}

/** Returns a valid access token, refreshing it when it is about to expire. */
export async function getValidAccessToken(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("google_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) throw new Error("Google account is not connected.");

  if (new Date(data.expires_at).getTime() - Date.now() > 60_000) {
    return data.access_token as string;
  }
  if (!data.refresh_token) throw new Error("Google session expired. Please reconnect.");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: data.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("Could not refresh the Google session. Please reconnect.");
  const t = (await res.json()) as TokenResponse;

  await supabase
    .from("google_connections")
    .update({
      access_token: t.access_token,
      expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return t.access_token;
}

/* ------------------------- Business Profile APIs ------------------------ */

async function gfetch<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Google API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

/** Picks the first account and first location (single-location MVP). */
export async function listFirstLocation(token: string): Promise<GoogleLocation> {
  const accounts = await gfetch<{ accounts?: { name: string }[] }>(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    token
  );
  const account = accounts.accounts?.[0];
  if (!account) throw new Error("No Google Business Profile accounts found.");

  const locs = await gfetch<{ locations?: { name: string; title?: string }[] }>(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title&pageSize=10`,
    token
  );
  const loc = locs.locations?.[0];
  if (!loc) throw new Error("No locations found for this account.");

  return { accountName: account.name, locationName: loc.name, title: loc.title ?? "My location" };
}

interface GoogleReview {
  name: string;
  reviewer?: { displayName?: string };
  starRating: string;
  comment?: string;
  createTime: string;
  reviewReply?: { comment: string; updateTime: string };
}

export async function fetchReviews(
  token: string,
  accountName: string,
  locationName: string
): Promise<SyncedReview[]> {
  const out: SyncedReview[] = [];
  let pageToken = "";

  for (let page = 0; page < 5; page++) {
    const qs = new URLSearchParams({ pageSize: "50" });
    if (pageToken) qs.set("pageToken", pageToken);

    const data = await gfetch<{ reviews?: GoogleReview[]; nextPageToken?: string }>(
      `https://mybusiness.googleapis.com/v4/${accountName}/${locationName}/reviews?${qs.toString()}`,
      token
    );

    for (const r of data.reviews ?? []) {
      out.push({
        reviewName: r.name,
        reviewerName: r.reviewer?.displayName ?? "Anonymous",
        rating: STAR[r.starRating] ?? 3,
        comment: r.comment ?? "",
        createTime: r.createTime,
        replyComment: r.reviewReply?.comment ?? null,
        replyTime: r.reviewReply?.updateTime ?? null,
      });
    }
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return out;
}

/** Posts (or overwrites) the owner reply: PUT .../reviews/{id}/reply  { comment } */
export async function postReply(
  token: string,
  reviewName: string,
  comment: string
): Promise<{ comment: string; updateTime: string }> {
  return gfetch<{ comment: string; updateTime: string }>(
    `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
    token,
    { method: "PUT", body: JSON.stringify({ comment }) }
  );
}

/* ------------------------------ Demo (mock) ------------------------------ */

export function mockLocation(): GoogleLocation {
  return {
    accountName: "accounts/mock",
    locationName: "locations/mock",
    title: "Demo Café & Kitchen",
  };
}

export function mockReviews(): SyncedReview[] {
  const base = "accounts/mock/locations/mock/reviews";
  const mk = (
    id: string,
    name: string,
    rating: number,
    comment: string,
    createTime: string
  ): SyncedReview => ({
    reviewName: `${base}/${id}`,
    reviewerName: name,
    rating,
    comment,
    createTime,
    replyComment: null,
    replyTime: null,
  });

  return [
    mk("rev_001", "Aarav Patel", 5, "Fantastic service! The staff were friendly and the food arrived hot and fast. Will definitely be back.", "2026-10-18T14:22:00Z"),
    mk("rev_002", "Meera Shah", 2, "Waited over 40 minutes for a table even with a reservation. The food was fine but the wait ruined the evening.", "2026-10-17T19:05:00Z"),
    mk("rev_003", "Rohan Mehta", 4, "Great ambience and tasty menu. Parking is a bit difficult but overall a lovely experience.", "2026-10-15T12:40:00Z"),
    mk("rev_004", "Priya Desai", 1, "Order was wrong and nobody apologised. Very disappointed with the attitude of the manager.", "2026-10-14T21:10:00Z"),
    mk("rev_005", "Kabir Joshi", 3, "Average experience. Nothing special, nothing terrible.", "2026-10-12T16:30:00Z"),
  ];
}