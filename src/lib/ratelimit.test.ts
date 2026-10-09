import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "./ratelimit";

describe("rateLimit", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  it("rejects when the limit is hit, allows again after the window", () => {
    const key = `t-${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(rateLimit(key, 3, 1000).ok).toBe(true);
    const r = rateLimit(key, 3, 1000);
    expect(r.ok).toBe(false);
    expect(r.retryAfterSec).toBeGreaterThan(0);
    vi.advanceTimersByTime(1001);
    expect(rateLimit(key, 3, 1000).ok).toBe(true);
  });
});
