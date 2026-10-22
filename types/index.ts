export interface Review {
  id: string;
  reviewerName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  createTime: string;
  replyComment: string | null;
  replyTime: string | null;
  aiDraft: string | null;
}

export interface InboxLocation {
  id: string;
  title: string;
}

export interface InboxResponse {
  connected: boolean;
  location: InboxLocation | null;
  reviews: Review[];
}

export interface GenerateReplyRequest {
  reviewId: string;
}

export interface GenerateReplyResponse {
  draft: string;
}

export interface PostReplyRequest {
  reviewId: string;
  comment: string;
}

export interface PostReplyResponse {
  reviewId: string;
  replyComment: string;
  replyTime: string;
  mock: boolean;
}

export interface ApiError {
  error: string;
}

/** Row shape of the `reviews` table in Supabase. */
export interface DbReviewRow {
  id: string;
  user_id: string;
  location_id: string;
  review_name: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  create_time: string;
  reply_comment: string | null;
  reply_time: string | null;
  ai_draft: string | null;
  synced_at: string;
}