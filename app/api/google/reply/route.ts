import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSessionUserId } from "@/lib/session";
import { getValidAccessToken, isMock, postReply } from "@/lib/google";
import type { ApiError, DbReviewRow, PostReplyRequest, PostReplyResponse } from "@/types";

// FR-4: "Approve & Post" publishes the human-approved text.
export async function POST(
  req: NextRequest
): Promise<NextResponse<PostReplyResponse | ApiError>> {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not connected." }, { status: 401 });

  let body: PostReplyRequest;
  try {
    body = (await req.json()) as PostReplyRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const comment = body.comment?.trim();
  if (!body.reviewId || !comment) {
    return NextResponse.json({ error: "reviewId and comment are required." }, { status: 400 });
  }
  if (Buffer.byteLength(comment, "utf8") > 4096) {
    return NextResponse.json({ error: "Reply is too long (max about 4 KB)." }, { status: 400 });
  }

  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", body.reviewId)
    .eq("user_id", userId)
    .maybeSingle();
  const review = data as DbReviewRow | null;
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });

  try {
    const mock = isMock();
    // LIVE: PUT to Google. MOCK: pretend it was posted.
    const reply = mock
      ? { comment, updateTime: new Date().toISOString() }
      : await postReply(await getValidAccessToken(userId), review.review_name, comment);

    const { error } = await supabase
      .from("reviews")
      .update({ reply_comment: reply.comment, reply_time: reply.updateTime })
      .eq("id", review.id);
    if (error) throw new Error(error.message);

    return NextResponse.json({
      reviewId: review.id,
      replyComment: reply.comment,
      replyTime: reply.updateTime,
      mock,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Posting the reply failed." },
      { status: 502 }
    );
  }
}