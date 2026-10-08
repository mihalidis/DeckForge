// LLM sağlayıcı seçimi. Tüm LLM çağrıları bu dosyadan model alır; sağlayıcı SDK'ları başka yerde import edilmez.
// LLM_PROVIDER=google | ollama | anthropic   (.env.local)

import type { LanguageModel } from "ai";

type ProviderOptions = NonNullable<Parameters<typeof import("ai").generateObject>[0]["providerOptions"]>;

export type Role = "intent" | "build";

const DEFAULT_MODELS: Record<string, Record<Role, string>> = {
  google: { intent: "gemini-3.5-flash,gemini-3.5-flash-lite", build: "gemini-3.8-flash,gemini-3.5-flash" },
  ollama: { intent: "qwen3:8b", build: "qwen3:14b" },
  anthropic: { intent: "claude-haiku-4-5", build: "claude-sonnet-4-5" },
};

export type ThinkingLevel = "minimal" | "low" | "medium" | "high";

/** Sağlayıcıya özel seçenekler. Gemini 3.x'te düşünme seviyesi gecikmeyi doğrudan belirler:
 *  intent için "minimal" (basit JSON), build için "medium" (kalite; "low" ~2x hızlı, env ile seçilir).
 *  .env: LLM_THINKING_INTENT / LLM_THINKING_BUILD. 3.7/3.8 Flash "minimal" kabul etmez → "low"a yükseltilir. */
export function providerOptionsFor(role: Role, modelId: string): ProviderOptions | undefined {
  if (providerName() !== "google") return undefined;
  const env = (role === "intent" ? process.env.LLM_THINKING_INTENT : process.env.LLM_THINKING_BUILD) as ThinkingLevel | undefined;
  let level: ThinkingLevel = env ?? (role === "intent" ? "minimal" : "medium");
  if (level === "minimal" && /gemini-3\.[78]-flash/.test(modelId)) level = "low";
  return { google: { thinkingConfig: { thinkingLevel: level } } };
}

export function providerName(): string {
  return process.env.LLM_PROVIDER ?? "google";
}

/** Virgülle ayrılmış model listesi: ilki tercih, sonrakiler yoğunluk/kota hatasında yedek. */
export function modelIdsFor(role: Role): string[] {
  const env = role === "intent" ? process.env.LLM_MODEL_INTENT : process.env.LLM_MODEL_BUILD;
  const raw = env || DEFAULT_MODELS[providerName()]?.[role] || DEFAULT_MODELS.google[role];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function modelIdFor(role: Role): string {
  return modelIdsFor(role)[0];
}

/** Günlük/dakikalık kota doldu (429 RESOURCE_EXHAUSTED). Yedek modele geçmeye değer ama kullanıcıya "yoğunluk" olarak gösterilir. */
export function isQuotaError(err: unknown): boolean {
  const e = err as { statusCode?: number; message?: string };
  return e?.statusCode === 429 || /exceeded your current quota|resource.?exhausted|rate limit/i.test(String(e?.message ?? ""));
}

/** Geçici sağlayıcı hataları (yoğunluk, kota, 5xx) — bir sonraki modele geçmeye değer. */
export function isTransientLlmError(err: unknown): boolean {
  const e = err as { statusCode?: number; message?: string; cause?: unknown; name?: string };
  if (e?.name === "AbortError" || e?.name === "TimeoutError") return true; // bizim zaman aşımımız
  const status = e?.statusCode ?? (e?.cause as { statusCode?: number } | undefined)?.statusCode;
  if (status && [429, 500, 502, 503, 504].includes(status)) return true;
  const msg = String(e?.message ?? "").toLowerCase();
  return /high demand|overloaded|resource exhausted|rate limit|quota|unavailable|try again/.test(msg);
}

/** Çağrı başına zaman aşımı (ms). Yavaş/sıkışık model yerine yedeğe geçmek için. */
export function timeoutFor(role: Role): number {
  const env = role === "intent" ? process.env.LLM_TIMEOUT_INTENT_MS : process.env.LLM_TIMEOUT_BUILD_MS;
  return Number(env) || (role === "intent" ? 15_000 : 60_000);
}

/** Rolün model listesini sırayla dener; geçici hatada sonrakine geçer, kalıcı hatada hemen fırlatır. */
export async function withModelFallback<T>(role: Role, fn: (model: LanguageModel, id: string) => Promise<T>): Promise<T> {
  const ids = modelIdsFor(role);
  let lastErr: unknown;
  for (const [i, id] of ids.entries()) {
    try {
      return await fn(await getModelById(id), id);
    } catch (err) {
      lastErr = err;
      if (i === ids.length - 1 || !isTransientLlmError(err)) throw err;
      console.warn(`[llm] ${id} geçici hata, ${ids[i + 1]} deneniyor: ${String((err as Error).message).slice(0, 120)}`);
    }
  }
  throw lastErr;
}

/** Paket adını değişkenden import eder ki kurulu olmayan opsiyonel sağlayıcılar tsc'yi kırmasın. */
async function dynamicImport(pkg: string): Promise<Record<string, unknown>> {
  try {
    return (await import(/* webpackIgnore: true */ pkg)) as Record<string, unknown>;
  } catch {
    throw new Error(`LLM_PROVIDER=${providerName()} için paket kurulu değil: npm i ${pkg}`);
  }
}

export async function getModel(role: Role): Promise<LanguageModel> {
  return getModelById(modelIdFor(role));
}

export async function getModelById(id: string): Promise<LanguageModel> {
  switch (providerName()) {
    case "google": {
      const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY tanımlı değil (.env.local)");
      return createGoogleGenerativeAI({ apiKey })(id);
    }
    case "ollama": {
      const mod = await dynamicImport("ollama-ai-provider-v2");
      const create = mod.createOllama as (o: { baseURL?: string }) => (id: string) => LanguageModel;
      return create({ baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/api" })(id);
    }
    case "anthropic": {
      const mod = await dynamicImport("@ai-sdk/anthropic");
      const create = mod.createAnthropic as (o: { apiKey?: string }) => (id: string) => LanguageModel;
      return create({ apiKey: process.env.ANTHROPIC_API_KEY })(id);
    }
    default:
      throw new Error(`Bilinmeyen LLM_PROVIDER: ${providerName()}`);
  }
}
