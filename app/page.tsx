import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Inbox,
  Link2,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  UserCheck,
} from "lucide-react";

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

const STEPS = [
  {
    icon: Link2,
    title: "Connect Google Shop",
    text: "Sign in with Google and link your Business Profile. InstantReviewReply never sees your password.",
  },
  {
    icon: Inbox,
    title: "See every review in one place",
    text: "Names, star ratings, dates, review text and reply status, all in a single inbox.",
  },
  {
    icon: Sparkles,
    title: "Generate Reply",
    text: "One click drafts a polite, professional response matched to the star rating and what the customer wrote.",
  },
  {
    icon: Send,
    title: "Edit, approve and post",
    text: "Tweak the draft if you like, then post it to Google Maps. Nothing goes live without your approval.",
  },
];

const FEATURES = [
  {
    icon: MessageSquareText,
    title: "One clean inbox",
    text: "Stop jumping between dashboards. Filter by Needs reply and Replied and work through reviews quickly.",
  },
  {
    icon: Sparkles,
    title: "Tone that fits the rating",
    text: "Apologetic for 1-2 stars, appreciative for 4-5 stars, and specific to the review instead of a generic template.",
  },
  {
    icon: UserCheck,
    title: "You stay in control",
    text: "Every AI draft is editable, and only the text you approve is posted.",
  },
  {
    icon: ShieldCheck,
    title: "Brand-safe by design",
    text: "Drafts avoid promising refunds or discounts, sharing personal details, or arguing with the reviewer.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navbar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              R
            </div>
            <span className="text-lg font-semibold tracking-tight">InstantReviewReply</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#how-it-works" className="hover:text-slate-900">
              How it works
            </a>
            <a href="#features" className="hover:text-slate-900">
              Features
            </a>
          </nav>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            Start <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
              <Sparkles className="h-3.5 w-3.5 text-brand-600" />
              AI replies for Google Maps reviews
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Reply to every Google review in minutes, not hours.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              InstantReviewReply brings all your Google Business Profile reviews into one inbox,
              drafts a thoughtful reply with AI, and posts it only after you approve.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700"
              >
                Start <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#how-it-works"
                className="rounded-full px-5 py-3.5 text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                See how it works
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              You&rsquo;ll be asked to connect your Google account on the next screen.
            </p>
          </div>

          {/* Product preview (sample data) */}
          <div className="relative">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  <Store className="h-3.5 w-3.5" /> Sample café
                </span>
                <span className="text-xs text-slate-400">Preview with sample data</span>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                      MS
                    </div>
                    <div>
                      <p className="font-semibold">Meera S.</p>
                      <p className="text-xs text-slate-400">2 days ago</p>
                    </div>
                  </div>
                  <Stars rating={2} size="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                  Waited over 40 minutes for a table even with a reservation. The food was
                  fine, but the wait ruined the evening.
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                  <Sparkles className="h-3.5 w-3.5" /> Draft by AI
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-800">
                  Hi Meera, we&rsquo;re sorry your reservation wasn&rsquo;t honoured on time and
                  that the wait took away from your evening. Your feedback helps us improve
                  how we manage tables. Please contact us directly so we can make this right.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="rounded-full border border-brand-200 bg-white px-4 py-1.5 text-xs font-semibold text-brand-700">
                    Edit
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white">
                    <Send className="h-3 w-3" /> Approve &amp; Post
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-16 bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">How InstantReviewReply works</h2>
            <p className="mt-3 text-slate-600">
              From connecting your shop to posting a reply in four simple steps.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-slate-300">0{i + 1}</span>
                </div>
                <h3 className="mt-5 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-16 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Faster replies, without losing your voice
            </h2>
            <p className="mt-3 text-slate-600">
              AI does the first draft. You make the final call.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl rounded-3xl bg-brand-900 px-8 py-14 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Ready to clear your review backlog?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-200">
            Connect your Google shop and have your first AI-drafted reply ready in seconds.
          </p>
          <Link
            href="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-brand-700 shadow-sm hover:bg-brand-50"
          >
            Start <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-brand-200">
            <CheckCircle2 className="h-4 w-4" /> You approve every reply before it is posted
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 text-sm text-slate-500 sm:flex-row">
          <span>© {new Date().getFullYear()} InstantReviewReply</span>
          <span>AI-generated drafts. Always review before posting.</span>
        </div>
      </footer>
    </div>
  );
}
