export function Stars({ rating, size = 18 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="m12 2.5 2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.7l1.2-6.6L2.5 9.5l6.6-.9z"
            fill={i <= Math.round(rating) ? "#f59e0b" : "#e2e8f0"}
          />
        </svg>
      ))}
    </span>
  );
}
