// Typed client for the Blizzard Hearthstone Game Data API. All Blizzard requests go through here.

import { getAccessToken } from "./auth";
import type {
  ApiCard,
  CardSearchParams,
  CardSearchResponse,
  DeckResponse,
  Metadata,
  Region,
} from "./types";

const DEFAULT_LOCALE = "en_US";
const MAX_PAGE_SIZE = 500;

export class BlizzardApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly path: string,
  ) {
    super(message);
    this.name = "BlizzardApiError";
  }
}

function region(): Region {
  return (process.env.BLIZZARD_REGION as Region) || "eu";
}

function baseUrl() {
  return `https://${region()}.api.blizzard.com/hearthstone`;
}

type Query = Record<string, string | number | undefined>;

function buildUrl(path: string, query: Query) {
  const url = new URL(`${baseUrl()}${path}`);
  url.searchParams.set("locale", DEFAULT_LOCALE);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  return url;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Authorized GET. Refreshes the token once on 401; on 429 waits Retry-After and retries once. */
export async function blizzardGet<T>(path: string, query: Query = {}, attempt = 0): Promise<T> {
  const url = buildUrl(path, query);
  const token = await getAccessToken({ force: attempt > 0 });
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (res.status === 401 && attempt === 0) return blizzardGet<T>(path, query, 1);
  if (res.status === 429 && attempt < 2) {
    const retry = Number(res.headers.get("retry-after") ?? "1");
    await sleep(Math.min(retry, 10) * 1000);
    return blizzardGet<T>(path, query, attempt + 1);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new BlizzardApiError(
      `Blizzard ${path} → HTTP ${res.status}: ${body.slice(0, 200)}`,
      res.status,
      path,
    );
  }
  return (await res.json()) as T;
}

export const blizzard = {
  metadata: () => blizzardGet<Metadata>("/metadata"),

  card: (idOrSlug: number | string) => blizzardGet<ApiCard>(`/cards/${idOrSlug}`),

  searchCards: (params: CardSearchParams) =>
    blizzardGet<CardSearchResponse>("/cards", params as Query),

  /** Walks all pages; progress can be reported via `onPage`. */
  async searchAllCards(
    params: Omit<CardSearchParams, "page">,
    onPage?: (page: number, pageCount: number, got: number) => void,
  ): Promise<ApiCard[]> {
    const pageSize = Math.min(params.pageSize ?? MAX_PAGE_SIZE, MAX_PAGE_SIZE);
    const out: ApiCard[] = [];
    let page = 1;
    let pageCount = 1;
    do {
      const res = await blizzard.searchCards({ ...params, pageSize, page });
      out.push(...res.cards);
      pageCount = res.pageCount;
      onPage?.(page, pageCount, out.length);
      page += 1;
    } while (page <= pageCount);
    return out;
  },

  deckByCode: (code: string) => blizzardGet<DeckResponse>("/deck", { code }),

  deckByIds: (ids: number[], hero: number, sideboard?: string) =>
    blizzardGet<DeckResponse>("/deck", {
      ids: ids.join(","),
      hero,
      sideboardCards: sideboard,
    }),
};
