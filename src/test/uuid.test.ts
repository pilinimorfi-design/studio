import { afterEach, describe, expect, it, vi } from "vitest";

import { createUuid } from "@/lib/uuid";

describe("createUuid", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses the browser UUID implementation when available", () => {
    vi.stubGlobal("crypto", {
      randomUUID: () => "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      getRandomValues: vi.fn(),
    });

    expect(createUuid()).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  });

  it("generates a valid UUID using secure random values when randomUUID is unavailable", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: (bytes: Uint8Array) => bytes.fill(0),
    });

    expect(createUuid()).toBe("00000000-0000-4000-8000-000000000000");
  });
});
