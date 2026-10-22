"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  LogOut,
  MessageSquareText,
  RefreshCw,
  Send,
  Sparkles,
  Star,
  Store,
} from "lucide-react";
import type {
  ApiError,
  GenerateReplyResponse,
  InboxResponse,
  PostReplyResponse,
  Review,
} from "@/types";

type Filter = "all" | "pending" | "replied";

const JSON_HEADERS = { "Content-Type": "application/json" };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = (await res.json()) as T | ApiError;
  if (!res.ok) throw new Error((data as ApiError).error ?? "Request failed.");
  return data as T;
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");

/* ------------------------------ Shared bits ------------------------------ */

function Stars({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
  return (
    <div className="flex" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${n <= rating ? "text-amber-400" : "text-slate-200"}`}
          fill="currentColor"
          strokeWidth={0}
        />
      ))}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
      {initials}
    </div>
  );
}

function StatusBadge({ review }: { review: Review }) {
  if (review.replyComment) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> Replied
      </span>
    );
  }
  if (review.aiDraft) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
        <Sparkles className="h-3.5 w-3.5" /> Draft ready
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
      <MessageSquareText className="h-3.5 w-3.5" /> Needs reply
    </span>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

/* -------------------------------- Navbar -------------------------------- */

function Navbar({
  connected,
  locationTitle,
  syncing,
  onSync,
  onLogout,
}: {
  connected: boolean;
  locationTitle?: string;
  syncing: boolean;
  onSync: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              R
            </div>
            <span className="text-lg font-semibold tracking-tight">InstantReviewReply</span>
          </Link>
          {connected && locationTitle && (
            <span className="ml-2 hidden items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 sm:inline-flex">
              <Store className="h-3.5 w-3.5" /> {locationTitle}
            </span>
          )}
        </div>
        {connected && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing…" : "Sync reviews"}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

/* ----------------------------- Connect screen ---------------------------- */

function ConnectScreen() {
  return (
    <div className="mx-auto mt-16 max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-card">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Store className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">Connect your Google shop</h1>
      <p className="mt-2 text-slate-600">
        Link your Google Business Profile to see every review in one inbox and reply with
        AI-drafted responses you approve first.
      </p>
      <a
        href="/api/auth/google"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
      >
        <Store className="h-4 w-4" /> Connect Google Shop
      </a>
    </div>
  );
}

/* ------------------------------- ReviewCard ------------------------------ */

function ReviewCard({
  review,
  selected,
  onSelect,
}: {
  review: Review;
  selected: boolean;
  onSelect: (r: Review) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(review)}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-card"
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar name={review.reviewerName} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-semibold text-slate-900">{review.reviewerName}</span>
            <span className="shrink-0 text-xs text-slate-400">
              {new Date(review.createTime).toLocaleDateString()}
            </span>
          </div>
          <div className="mt-1">
            <Stars rating={review.rating} />
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">
            {review.comment || <span className="italic text-slate-400">No text, rating only</span>}
          </p>
          <div className="mt-3">
            <StatusBadge review={review} />
          </div>
        </div>
      </div>
    </button>
  );
}

/* ----------------------------- ResponseEditor ---------------------------- */

function ResponseEditor({
  review,
  draft,
  onDraftChange,
  onGenerate,
  onPost,
  generating,
  posting,
  error,
  notice,
}: {
  review: Review | null;
  draft: string;
  onDraftChange: (v: string) => void;
  onGenerate: () => void;
  onPost: () => void;
  generating: boolean;
  posting: boolean;
  error: string | null;
  notice: string | null;
}) {
  if (!review) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Pick a review to get started</h3>
        <p className="mt-1 max-w-xs text-sm text-slate-500">
          Select a review on the left and let AI draft a reply for you to approve.
        </p>
      </div>
    );
  }

  const busy = generating || posting;
  const replied = !!review.replyComment;

  return (
    <div className="flex h-full flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="rounded-xl bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={review.reviewerName} />
            <div>
              <p className="font-semibold">{review.reviewerName}</p>
              <p className="text-xs text-slate-400">
                {new Date(review.createTime).toLocaleString()}
              </p>
            </div>
          </div>
          <Stars rating={review.rating} size="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          {review.comment || <span className="italic text-slate-400">No text, rating only</span>}
        </p>
      </div>

      {replied ? (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">Your reply</p>
            <StatusBadge review={review} />
          </div>
          <p className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm leading-relaxed text-slate-800">
            {review.replyComment}
          </p>
          {review.replyTime && (
            <p className="mt-2 text-xs text-slate-400">
              Posted {new Date(review.replyTime).toLocaleString()}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between">
            <label htmlFor="reply" className="text-sm font-semibold text-slate-800">
              Your reply
            </label>
            <span className="text-xs text-slate-400">{draft.length} characters</span>
          </div>

          <textarea
            id="reply"
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            disabled={busy}
            rows={7}
            placeholder="Click “Generate Reply” or write your own response…"
            className="mt-2 w-full flex-1 resize-none rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:bg-slate-50"
          />

          {error && (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onGenerate}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? "Generating…" : "Generate Reply"}
            </button>
            <button
              type="button"
              onClick={onPost}
              disabled={busy || !draft.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {posting ? "Posting…" : "Approve & Post"}
            </button>
          </div>
        </>
      )}

      {notice && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>
      )}
    </div>
  );
}

/* --------------------------------- Page --------------------------------- */

export default function DashboardPage() {
  const router = useRouter();
  const [inbox, setInbox] = useState<InboxResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reviews = useMemo(() => inbox?.reviews ?? [], [inbox]);
  const selected = reviews.find((r) => r.id === selectedId) ?? null;

  const load = useCallback(async () => {
    const data = await api<InboxResponse>("/api/google/reviews");
    setInbox(data);
    return data;
  }, []);

  const sync = useCallback(async () => {
    setSyncing(true);
    setPageError(null);
    try {
      await api<unknown>("/api/google/reviews", { method: "POST" });
      await load();
    } catch (e) {
      setPageError(errMsg(e));
    } finally {
      setSyncing(false);
    }
  }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");
    if (oauthError) {
      setPageError(oauthError);
      window.history.replaceState(null, "", "/dashboard");
    }
    (async () => {
      try {
        const data = await load();
        if (data.connected && !data.location) await sync(); // first-time sync
      } catch (e) {
        setPageError(errMsg(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [load, sync]);

  const updateReview = (id: string, patch: Partial<Review>) =>
    setInbox((prev) =>
      prev ? { ...prev, reviews: prev.reviews.map((r) => (r.id === id ? { ...r, ...patch } : r)) } : prev
    );

  const handleSelect = (r: Review) => {
    setSelectedId(r.id);
    setDraft(r.aiDraft ?? "");
    setEditorError(null);
    setNotice(null);
  };

  const handleGenerate = async () => {
    if (!selected) return;
    setGenerating(true);
    setEditorError(null);
    setNotice(null);
    try {
      const data = await api<GenerateReplyResponse>("/api/ai/generate-reply", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ reviewId: selected.id }),
      });
      setDraft(data.draft);
      updateReview(selected.id, { aiDraft: data.draft });
    } catch (e) {
      setEditorError(errMsg(e));
    } finally {
      setGenerating(false);
    }
  };

  const handlePost = async () => {
    if (!selected || !draft.trim()) return;
    setPosting(true);
    setEditorError(null);
    setNotice(null);
    try {
      const data = await api<PostReplyResponse>("/api/google/reply", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ reviewId: selected.id, comment: draft }),
      });
      updateReview(selected.id, { replyComment: data.replyComment, replyTime: data.replyTime });
      setNotice(
        data.mock
          ? "Demo mode: reply saved but NOT sent to Google."
          : "Reply posted to Google Maps."
      );
    } catch (e) {
      setEditorError(errMsg(e));
    } finally {
      setPosting(false);
    }
  };

  const handleLogout = async () => {
    await api<unknown>("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const stats = useMemo(() => {
    const total = reviews.length;
    const replied = reviews.filter((r) => r.replyComment).length;
    const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    return {
      total,
      replied,
      pending: total - replied,
      avg: avg.toFixed(1),
      rate: total ? Math.round((replied / total) * 100) : 0,
    };
  }, [reviews]);

  const visible = reviews.filter((r) =>
    filter === "all" ? true : filter === "replied" ? !!r.replyComment : !r.replyComment
  );

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: stats.total },
    { key: "pending", label: "Needs reply", count: stats.pending },
    { key: "replied", label: "Replied", count: stats.replied },
  ];

  const connected = !!inbox?.connected;

  return (
    <>
      <Navbar
        connected={connected}
        locationTitle={inbox?.location?.title}
        syncing={syncing}
        onSync={sync}
        onLogout={handleLogout}
      />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {pageError && (
          <p className="mb-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{pageError}</p>
        )}

        {loading ? (
          <div className="flex justify-center py-24 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !connected ? (
          <ConnectScreen />
        ) : (
          <>
            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Total reviews" value={String(stats.total)} />
              <StatCard label="Average rating" value={stats.avg} hint="out of 5" />
              <StatCard label="Response rate" value={`${stats.rate}%`} hint="goal: 100%" />
              <StatCard label="Awaiting reply" value={String(stats.pending)} />
            </section>

            <section className="mt-6 grid grid-cols-1 gap-6 lg:h-[680px] lg:grid-cols-[minmax(340px,2fr)_3fr]">
              <div className="flex min-h-0 flex-col">
                <div className="mb-3 flex gap-2 rounded-full bg-slate-100 p-1">
                  {tabs.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setFilter(t.key)}
                      className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                        filter === t.key
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {t.label} <span className="text-xs text-slate-400">{t.count}</span>
                    </button>
                  ))}
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
                  {visible.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                      {syncing ? "Syncing reviews…" : "Nothing here."}
                    </p>
                  )}
                  {visible.map((r) => (
                    <ReviewCard
                      key={r.id}
                      review={r}
                      selected={r.id === selectedId}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </div>

              <div className="min-h-[480px] lg:min-h-0">
                <ResponseEditor
                  review={selected}
                  draft={draft}
                  onDraftChange={setDraft}
                  onGenerate={handleGenerate}
                  onPost={handlePost}
                  generating={generating}
                  posting={posting}
                  error={editorError}
                  notice={notice}
                />
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
