// Battle.net OAuth client-credentials token yönetimi.
// Token yalnızca sunucuda tutulur; bellek önbelleği + süre dolmadan 5 dk önce yenileme.

import type { OAuthTokenResponse } from "./types";

const TOKEN_URL = "https://oauth.battle.net/token";
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

interface CachedToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

let cache: CachedToken | null = null;
let inflight: Promise<CachedToken> | null = null;

function readCredentials() {
  const id = process.env.BLIZZARD_CLIENT_ID;
  const secret = process.env.BLIZZARD_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error(
      "BLIZZARD_CLIENT_ID / BLIZZARD_CLIENT_SECRET tanımlı değil (.env.local)",
    );
  }
  return { id, secret };
}

async function requestToken(fetchImpl: typeof fetch): Promise<CachedToken> {
  const { id, secret } = readCredentials();
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Battle.net token alınamadı: HTTP ${res.status} ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as OAuthTokenResponse;
  return {
    accessToken: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

/** Geçerli bir access token döner; gerekirse yeniler. Eşzamanlı çağrılar tek isteği paylaşır. */
export async function getAccessToken(opts: { force?: boolean; fetchImpl?: typeof fetch } = {}) {
  const fetchImpl = opts.fetchImpl ?? fetch;
  if (!opts.force && cache && cache.expiresAt - Date.now() > REFRESH_MARGIN_MS) {
    return cache.accessToken;
  }
  if (!inflight) {
    inflight = requestToken(fetchImpl)
      .then((t) => {
        cache = t;
        return t;
      })
      .finally(() => {
        inflight = null;
      });
  }
  const t = await inflight;
  return t.accessToken;
}

/** Testler için önbelleği sıfırlar. */
export function resetTokenCache() {
  cache = null;
  inflight = null;
}
