import { Stars } from "./Stars";
import { reviews, reviewSummary } from "@/lib/reviews";
import { site } from "@/lib/site";

function GoogleG({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.200 5.300-4.700 6.900l7.300 5.700c4.300-4 6.800-9.900 6.800-17.100z" />
      <path fill="#FBBC05" d="M10.500 28.700A14.500 14.500 0 0 1 9.500 24c0-1.600.3-3.200.8-4.700l-7.900-6.100A24 24 0 0 0 0 24c0 3.900.9 7.500 2.600 10.800l7.900-6.100z" />
      <path fill="#34A853" d="M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.300-5.700c-2 1.400-4.600 2.300-8.600 2.300-6.300 0-11.600-4-13.500-9.800l-7.900 6.100C6.500 42.600 14.600 48 24 48z" />
    </svg>
  );
}

export function GoogleReviews() {
  return (
    <section className="section bg-slate-50" aria-labelledby="reviews-heading">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Customer reviews</p>
          <h2 id="reviews-heading" className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Trusted by homeowners and businesses
          </h2>
          <p className="mt-4 text-slate-600">See what our customers say about working with {site.name}.</p>
        </div>

        <div className="mx-auto mt-8 flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4">
            <GoogleG size={40} />
            <div>
              <p className="text-sm font-semibold text-slate-600">Google rating</p>
              <div className="flex items-center gap-2">
                <span className="font-heading text-3xl font-extrabold text-brand-900">{reviewSummary.rating.toFixed(1)}</span>
                <Stars rating={reviewSummary.rating} size={20} />
              </div>
              <p className="text-sm text-slate-600">Based on {reviewSummary.count} reviews</p>
            </div>
          </div>
          <a href={site.social.googleReviewLink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            Write a review<span className="sr-only"> (opens Google in a new tab)</span>
          </a>
        </div>

        <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <li key={r.name}>
              <figure className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <Stars rating={r.rating} />
                  <GoogleG size={20} />
                </div>
                <blockquote className="mt-4 flex-1 text-[0.9375rem] leading-relaxed text-slate-700">“{r.text}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                  <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-900">
                    {r.initials}
                  </span>
                  <span className="text-sm">
                    <span className="block font-semibold text-brand-900">{r.name}</span>
                    <span className="text-slate-500">{r.service} · {r.timeAgo}</span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center">
          <a href={site.social.googleProfile} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
            Read all reviews on Google<span className="sr-only"> (opens in a new tab)</span>
          </a>
          {!reviewSummary.verified && (
            <p className="mt-4 text-xs text-slate-500">Sample reviews shown as placeholders — replace with your real Google reviews.</p>
          )}
        </div>
      </div>
    </section>
  );
}
