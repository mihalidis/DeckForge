import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAccessToken, resetTokenCache } from "./auth";

function fakeFetch(expiresIn = 86399) {
  let n = 0;
  const impl = vi.fn(async () => {
    n += 1;
    return new Response(
      JSON.stringify({ access_token: `tok-${n}`, token_type: "bearer", expires_in: expiresIn }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  });
  return { impl: impl as unknown as typeof fetch, calls: () => n };
}

describe("getAccessToken", () => {
  beforeEach(() => {
    resetTokenCache();
    process.env.BLIZZARD_CLIENT_ID = "id";
    process.env.BLIZZARD_CLIENT_SECRET = "secret";
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("caches the token and does not request again", async () => {
    const f = fakeFetch();
    expect(await getAccessToken({ fetchImpl: f.impl })).toBe("tok-1");
    expect(await getAccessToken({ fetchImpl: f.impl })).toBe("tok-1");
    expect(f.calls()).toBe(1);
  });

  it("refreshes 5 min before expiry", async () => {
    const f = fakeFetch(600); // 10 min
    await getAccessToken({ fetchImpl: f.impl });
    vi.advanceTimersByTime(4 * 60 * 1000);
    expect(await getAccessToken({ fetchImpl: f.impl })).toBe("tok-1");
    vi.advanceTimersByTime(2 * 60 * 1000); // 4 min left < 5 min margin
    expect(await getAccessToken({ fetchImpl: f.impl })).toBe("tok-2");
  });

  it("concurrent calls share a single request", async () => {
    const f = fakeFetch();
    const [a, b, c] = await Promise.all([
      getAccessToken({ fetchImpl: f.impl }),
      getAccessToken({ fetchImpl: f.impl }),
      getAccessToken({ fetchImpl: f.impl }),
    ]);
    expect([a, b, c]).toEqual(["tok-1", "tok-1", "tok-1"]);
    expect(f.calls()).toBe(1);
  });

  it("throws a clear error when credentials are missing", async () => {
    delete process.env.BLIZZARD_CLIENT_ID;
    await expect(getAccessToken({ fetchImpl: fakeFetch().impl })).rejects.toThrow(/BLIZZARD_CLIENT_ID/);
  });
});
