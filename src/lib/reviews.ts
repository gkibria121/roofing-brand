/**
 * GOOGLE REVIEWS — PLACEHOLDER DATA
 *
 * The reviews below are sample placeholders so the layout can be reviewed.
 * Before launch, replace them with your real Google reviews:
 *   Option A (simplest): copy real reviews (with permission/attribution) into this array.
 *   Option B: fetch them from the Google Places API (New) in a Server Component
 *             using your Place ID and an API key kept in an env variable.
 *
 * Set `verified` to true ONLY when the rating/count below match your real Google
 * Business Profile. When true, the site also emits AggregateRating structured data
 * (Google penalises fake review markup, so it is omitted while this is false).
 */
export const reviewSummary = {
  verified: false,
  rating: 4.9,
  count: 187,
} as const;

export type Review = {
  name: string;
  initials: string;
  timeAgo: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  service: string;
};

export const reviews: Review[] = [
  {
    name: "Sample Customer A",
    initials: "SA",
    timeAgo: "2 weeks ago",
    rating: 5,
    service: "Roof replacement",
    text: "The crew showed up on time, protected our landscaping and finished the whole roof in two days. The yard was spotless afterwards. Highly recommend T&S Roofing Systems.",
  },
  {
    name: "Sample Customer B",
    initials: "SB",
    timeAgo: "1 month ago",
    rating: 5,
    service: "Leak repair",
    text: "We had a leak after a storm and they came out the same day. Honest advice, fair price, and the problem has not come back. Professional from start to finish.",
  },
  {
    name: "Sample Customer C",
    initials: "SC",
    timeAgo: "2 months ago",
    rating: 5,
    service: "Commercial flat roof",
    text: "They replaced the flat roof on our warehouse without interrupting our operations. Clear communication, great quality and a detailed warranty.",
  },
  {
    name: "Sample Customer D",
    initials: "SD",
    timeAgo: "3 months ago",
    rating: 5,
    service: "Metal roofing",
    text: "Our new metal roof looks incredible and the team walked us through every option. The estimate matched the final bill exactly.",
  },
  {
    name: "Sample Customer E",
    initials: "SE",
    timeAgo: "4 months ago",
    rating: 4,
    service: "Insurance claim",
    text: "Very helpful with our insurance claim after hail damage. They documented everything and met with the adjuster. Roof looks fantastic.",
  },
  {
    name: "Sample Customer F",
    initials: "SF",
    timeAgo: "5 months ago",
    rating: 5,
    service: "Roof inspection",
    text: "Great experience from the free inspection to the final walkthrough. Friendly, knowledgeable and no pressure. Will use again.",
  },
];
