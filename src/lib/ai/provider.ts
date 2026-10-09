// LLM provider selection. All LLM calls get their model from this file; provider SDKs are not imported anywhere else.
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

/** Provider-specific options. On Gemini 3.x the thinking level directly drives latency:
 *  "minimal" for intent (simple JSON), "medium" for build (quality; "low" is ~2x faster, chosen via env).
 *  .env: LLM_THINKING_INTENT / LLM_THINKING_BUILD. 3.7/3.8 Flash doesn't accept "minimal" → raised to "low". */
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

/** Comma-separated model list: the first is preferred, the rest are fallbacks on overload/quota errors. */
export function modelIdsFor(role: Role): string[] {
  const env = role === "intent" ? process.env.LLM_MODEL_INTENT : process.env.LLM_MODEL_BUILD;
  const raw = env || DEFAULT_MODELS[providerName()]?.[role] || DEFAULT_MODELS.google[role];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function modelIdFor(role: Role): string {
  return modelIdsFor(role)[0];
}

/** Daily/per-minute quota exhausted (429 RESOURCE_EXHAUSTED). Worth falling back to another model, but shown to the user as "busy". */
export function isQuotaError(err: unknown): boolean {
  const e = err as { statusCode?: number; message?: string };
  return e?.statusCode === 429 || /exceeded your current quota|resource.?exhausted|rate limit/i.test(String(e?.message ?? ""));
}

/** Transient provider errors (overload, quota, 5xx) — worth moving on to the next model. */
export function isTransientLlmError(err: unknown): boolean {
  const e = err as { statusCode?: number; message?: string; cause?: unknown; name?: string };
  if (e?.name === "AbortError" || e?.name === "TimeoutError") return true; // our own timeout
  const status = e?.statusCode ?? (e?.cause as { statusCode?: number } | undefined)?.statusCode;
  if (status && [429, 500, 502, 503, 504].includes(status)) return true;
  const msg = String(e?.message ?? "").toLowerCase();
  return /high demand|overloaded|resource exhausted|rate limit|quota|unavailable|try again/.test(msg);
}

/** Per-call timeout (ms). Lets us fall back instead of waiting on a slow/congested model. */
export function timeoutFor(role: Role): number {
  const env = role === "intent" ? process.env.LLM_TIMEOUT_INTENT_MS : process.env.LLM_TIMEOUT_BUILD_MS;
  return Number(env) || (role === "intent" ? 15_000 : 60_000);
}

/** Tries the role's model list in order; moves on after a transient error, throws immediately on a permanent one. */
export async function withModelFallback<T>(role: Role, fn: (model: LanguageModel, id: string) => Promise<T>): Promise<T> {
  const ids = modelIdsFor(role);
  let lastErr: unknown;
  for (const [i, id] of ids.entries()) {
    try {
      return await fn(await getModelById(id), id);
    } catch (err) {
      lastErr = err;
      if (i === ids.length - 1 || !isTransientLlmError(err)) throw err;
      console.warn(`[llm] ${id} transient error, trying ${ids[i + 1]}: ${String((err as Error).message).slice(0, 120)}`);
    }
  }
  throw lastErr;
}

/** Imports the package name from a variable so optional providers that aren't installed don't break tsc. */
async function dynamicImport(pkg: string): Promise<Record<string, unknown>> {
  try {
    return (await import(/* webpackIgnore: true */ pkg)) as Record<string, unknown>;
  } catch {
    throw new Error(`Package for LLM_PROVIDER=${providerName()} is not installed: npm i ${pkg}`);
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
      if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set (.env.local)");
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
      throw new Error(`Unknown LLM_PROVIDER: ${providerName()}`);
  }
}
