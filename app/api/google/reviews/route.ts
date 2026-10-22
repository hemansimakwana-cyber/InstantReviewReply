import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSessionUserId } from "@/lib/session";
import {
  fetchReviews,
  getValidAccessToken,
  isMock,
  listFirstLocation,
  mockLocation,
  mockReviews,
} from "@/lib/google";
import type { ApiError, DbReviewRow, InboxResponse, Review } from "@/types";

export const dynamic = "force-dynamic";

function toReview(r: DbReviewRow): Review {
  return {
    id: r.id,
    reviewerName: r.reviewer_name,
    rating: r.rating as Review["rating"],
    comment: r.comment,
    createTime: r.create_time,
    replyComment: r.reply_comment,
    replyTime: r.reply_time,
    aiDraft: r.ai_draft,
  };
}

/** FR-2: read the synced inbox from the database. */
export async function GET(): Promise<NextResponse<InboxResponse | ApiError>> {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ connected: false, location: null, reviews: [] });

  const { data: location } = await supabase
    .from("locations")
    .select("id,title")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!location) return NextResponse.json({ connected: true, location: null, reviews: [] });

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("location_id", location.id)
    .order("create_time", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    connected: true,
    location: { id: location.id, title: location.title },
    reviews: ((data ?? []) as DbReviewRow[]).map(toReview),
  });
}

/** Sync: pull reviews from Google Business Profile and upsert them into the database. */
export async function POST(): Promise<NextResponse<{ synced: number } | ApiError>> {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not connected." }, { status: 401 });

  try {
    const mock = isMock();
    // LIVE: real Google Business Profile calls. MOCK: demo data.
    const token = mock ? "" : await getValidAccessToken(userId);
    const loc = mock ? mockLocation() : await listFirstLocation(token);
    const synced = mock
      ? mockReviews()
      : await fetchReviews(token, loc.accountName, loc.locationName);

    const { data: locRow, error: locErr } = await supabase
      .from("locations")
      .upsert(
        {
          user_id: userId,
          account_name: loc.accountName,
          location_name: loc.locationName,
          title: loc.title,
        },
        { onConflict: "user_id,location_name" }
      )
      .select("id")
      .single();
    if (locErr || !locRow) throw new Error(locErr?.message ?? "Could not save location.");

    const now = new Date().toISOString();
    const rows = synced.map((r) => {
      const base = {
        user_id: userId,
        location_id: locRow.id,
        review_name: r.reviewName,
        reviewer_name: r.reviewerName,
        rating: r.rating,
        comment: r.comment,
        create_time: r.createTime,
        synced_at: now,
      };
      // In demo mode don't overwrite replies you posted locally.
      return mock ? base : { ...base, reply_comment: r.replyComment, reply_time: r.replyTime };
    });

    if (rows.length) {
      const { error } = await supabase
        .from("reviews")
        .upsert(rows, { onConflict: "user_id,review_name" });
      if (error) throw new Error(error.message);
    }

    return NextResponse.json({ synced: rows.length });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sync failed." },
      { status: 502 }
    );
  }
}