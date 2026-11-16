import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StarRatingPicker } from "@/components/ReviewStars";
import { getGoogleReviewUrl } from "@/lib/reviews";

describe("StarRatingPicker", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("selects a rating", () => {
    const onChange = vi.fn();
    render(<StarRatingPicker value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "4 αστέρια" }));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("disables rating buttons while a submission is pending", () => {
    render(<StarRatingPicker value={3} onChange={vi.fn()} disabled />);

    expect(screen.getByRole("button", { name: "3 αστέρια" })).toBeDisabled();
  });
});

describe("Google review link", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts HTTPS Google review links", () => {
    vi.stubEnv("VITE_GOOGLE_REVIEW_URL", "https://g.page/r/example/review");

    expect(getGoogleReviewUrl()).toBe("https://g.page/r/example/review");
  });

  it("does not expose unconfigured or non-Google links", () => {
    vi.stubEnv("VITE_GOOGLE_REVIEW_URL", "https://example.com/review");

    expect(getGoogleReviewUrl()).toBeNull();
  });
});
