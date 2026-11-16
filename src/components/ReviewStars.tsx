import { Star } from "lucide-react";

export function StarRatingPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label="Αξιολόγηση από 1 έως 5 αστέρια" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          aria-label={`${rating} ${rating === 1 ? "αστέρι" : "αστέρια"}`}
          aria-pressed={value === rating}
          disabled={disabled}
          onClick={() => onChange(rating)}
          className="rounded-sm p-1 text-amber-500 transition-colors hover:text-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Star
            className="size-8"
            fill={value !== null && rating <= value ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

export function StarRatingDisplay({ rating }: { rating: number }) {
  return (
    <div
      role="img"
      aria-label={`${rating.toFixed(1)} από 5 αστέρια`}
      className="flex gap-0.5 text-amber-500"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          className="size-6"
          fill={star <= Math.round(rating) ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}
