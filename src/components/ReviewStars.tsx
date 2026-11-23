import { Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function StarRatingPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const displayRating = hoverRating !== null ? hoverRating : value;

  return (
    <div role="group" aria-label="Αξιολόγηση από 1 έως 5 αστέρια" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((rating) => {
        const fill = rating <= (displayRating ?? 0);
        return (
          <button
            key={rating}
            type="button"
            aria-label={`${rating} ${rating === 1 ? "αστέρι" : "αστέρια"}`}
            aria-pressed={value === rating}
            disabled={disabled}
            onClick={() => onChange(rating)}
            onMouseEnter={() => setHoverRating(rating)}
            onMouseLeave={() => setHoverRating(null)}
            className="rounded-sm p-1 text-amber-500 transition-colors hover:text-amber-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Star className="size-8" fill={fill ? "currentColor" : "none"} />
          </button>
        );
      })}
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

export function StarRatingFill({ rating }: { rating: number }) {
  const fillPercent = Math.max(0, Math.min(100, rating * 20));
  return (
    <div
      role="img"
      aria-label={`${rating.toFixed(1)} από 5 αστέρια`}
      className="relative flex gap-0.5 text-amber-500"
    >
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} aria-hidden="true" className="size-6 stroke-amber-500 fill-none" />
        ))}
      </div>
      <div
        className="absolute inset-0 flex gap-0.5 overflow-hidden text-amber-500"
        style={{ width: `${fillPercent}%` }}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} aria-hidden="true" className="size-6 fill-current" />
        ))}
      </div>
    </div>
  );
}

export function StarRatingPartialFill({ rating }: { rating: number }) {
  return (
    <div
      role="img"
      aria-label={`${rating.toFixed(1)} από 5 αστέρια`}
      className="flex items-center gap-2 text-amber-400"
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(100, (rating - i) * 100));
        return (
          <span key={i} className="relative inline-block w-5 h-5">
            <Star className="w-5 h-5 text-amber-400/40" aria-hidden="true" />
            <div
              className="absolute top-0 left-0 h-full overflow-hidden"
              style={{ width: `${fill}%` }}
            >
              <Star className="w-5 h-5 shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
            </div>
          </span>
        );
      })}
    </div>
  );
}

const USER_RATING_KEY = "pilinimorfi_user_rating";

export function ReviewStarsWidget({
  averageRating,
  reviewCount,
  userRating,
  onRate,
  submitting,
  showHint = true,
  starsFirst = false,
  starSize: starSizeProp = "small",
  ratingDisplay = true,
}: {
  averageRating: number | null;
  reviewCount: number;
  userRating: number | null;
  onRate: (rating: number) => void;
  submitting: boolean;
  showHint?: boolean;
  starsFirst?: boolean;
  starSize?: "small" | "large";
  ratingDisplay?: boolean;
}) {
  const starCls = starSizeProp === "large" ? "w-6 h-6" : "w-5 h-5";
  const textCls =
    starSizeProp === "large" ? "text-xs text-muted-foreground" : "text-sm font-medium";
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [storedRating, setStoredRating] = useState<number | null>(null);
  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(USER_RATING_KEY);
      if (saved && userRating === null) {
        setStoredRating(Number(saved));
      }
    } catch {
      // localStorage unavailable or unreadable; ignore
    }
  }, [userRating]);

  useEffect(() => {
    if (userRating !== null) {
      setStoredRating(userRating);
      try {
        localStorage.setItem(USER_RATING_KEY, String(userRating));
      } catch {
        // localStorage unavailable or unwritable; ignore
      }
    }
  }, [userRating]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (confirmation) {
      timer = setTimeout(() => setConfirmation(null), 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [confirmation]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!starsRef.current) return;
    const rect = starsRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const starWidth = rect.width / 5;
    let rating = Math.ceil(x / starWidth);
    rating = Math.max(1, Math.min(5, rating));
    setHoverRating(rating);
  };

  const handleMouseLeave = () => {
    setHoverRating(null);
  };

  const handleClick = (rating: number) => {
    setHoverRating(null);
    onRate(rating);
    setConfirmation("Η αξιολόγηση σας καταχωρήθηκε!");
  };

  const showPreview = hoverRating !== null;
  const displayRating = showPreview ? hoverRating! : (averageRating ?? 0);
  const effectiveUserRating = userRating ?? storedRating;
  const hint = effectiveUserRating ? "Άλλαξε την αξιολόγησή σου" : "Αξιολογήστε μας";

  const ratingText =
    averageRating != null
      ? averageRating.toLocaleString("el-GR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + "/5"
      : null;

  return (
    <div className="flex items-center gap-2">
      {confirmation && <p className="text-xs font-medium text-primary">{confirmation}</p>}
      {showHint && <p className={textCls}>{hint}</p>}
      <div className="inline-flex items-center gap-2">
        {starsFirst ? (
          <>
            <div
              ref={starsRef}
              role="group"
              aria-label="Αξιολόγηση από 1 έως 5 αστέρια"
              className="flex gap-1 cursor-pointer"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {[1, 2, 3, 4, 5].map((rating) => {
                const fill = showPreview
                  ? rating <= (hoverRating ?? 0)
                    ? 100
                    : 0
                  : Math.max(0, Math.min(100, (displayRating - (rating - 1)) * 100));
                return (
                  <span
                    key={rating}
                    className={`relative inline-block ${starCls} transition-transform duration-200 hover:scale-125`}
                    onClick={() => handleClick(rating)}
                    onMouseEnter={() => setHoverRating(rating)}
                    onMouseLeave={() => setHoverRating(null)}
                  >
                    <Star className={`${starCls} text-amber-400/40`} aria-hidden="true" />
                    <div
                      className="absolute top-0 left-0 h-full overflow-hidden"
                      style={{ width: `${fill}%` }}
                    >
                      <Star
                        className={`${starCls} shrink-0 fill-amber-400 text-amber-400`}
                        aria-hidden="true"
                      />
                    </div>
                  </span>
                );
              })}
            </div>
            {ratingText && ratingDisplay && (
              <span className={textCls + " text-muted-foreground"}>{ratingText}</span>
            )}
            {ratingDisplay && <span className={textCls}>({reviewCount})</span>}
          </>
        ) : (
          <>
            {ratingText && <span className={textCls + " text-muted-foreground"}>{ratingText}</span>}
            <div
              ref={starsRef}
              role="group"
              aria-label="Αξιολόγηση από 1 έως 5 αστέρια"
              className="flex gap-1 cursor-pointer"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {[1, 2, 3, 4, 5].map((rating) => {
                const fill = showPreview
                  ? rating <= (hoverRating ?? 0)
                    ? 100
                    : 0
                  : Math.max(0, Math.min(100, (displayRating - (rating - 1)) * 100));
                return (
                  <span
                    key={rating}
                    className={`relative inline-block ${starCls} transition-transform duration-200 hover:scale-125`}
                    onClick={() => handleClick(rating)}
                    onMouseEnter={() => setHoverRating(rating)}
                    onMouseLeave={() => setHoverRating(null)}
                  >
                    <Star className={`${starCls} text-amber-400/40`} aria-hidden="true" />
                    <div
                      className="absolute top-0 left-0 h-full overflow-hidden"
                      style={{ width: `${fill}%` }}
                    >
                      <Star
                        className={`${starCls} shrink-0 fill-amber-400 text-amber-400`}
                        aria-hidden="true"
                      />
                    </div>
                  </span>
                );
              })}
            </div>
            <span className={textCls}>({reviewCount})</span>
          </>
        )}
      </div>
    </div>
  );
}
