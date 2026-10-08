"use client";
// /api/forge SSE istemcisi. Adım olaylarını ve sonucu state'e yazar.

import { useCallback, useRef, useState } from "react";
import type { StepEvent, StepId } from "@/lib/deck/pipeline";
import type { DeckResult } from "@/lib/deck/types";

export type ErrorKind = "vague" | "rotated" | "api" | "invalid" | "llm" | "busy";
export interface ForgeErrorState { kind: ErrorKind; message: string }
export type StepStatus = "pending" | "active" | "done";
export interface StepState { id: StepId; status: StepStatus; detail?: string; ms?: number }

export const STEP_IDS: StepId[] = ["intent", "retrieve", "build", "validate", "encode"];
const initialSteps = (): StepState[] => STEP_IDS.map((id) => ({ id, status: "pending" }));

export type Phase = "idle" | "generating" | "result";

export function useForge() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [steps, setSteps] = useState<StepState[]>(initialSteps);
  const [deck, setDeck] = useState<DeckResult | null>(null);
  const [error, setError] = useState<ForgeErrorState | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const clockRef = useRef<number | null>(null);

  const stopClock = () => { if (clockRef.current) { window.clearInterval(clockRef.current); clockRef.current = null; } };

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    stopClock();
    setPhase("idle");
    setSteps(initialSteps());
  }, []);

  const reset = useCallback(() => {
    cancel();
    setDeck(null);
    setError(null);
    setElapsedMs(0);
  }, [cancel]);

  const forge = useCallback(async (prompt: string) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setError(null);
    setDeck(null);
    setSteps(initialSteps());
    setPhase("generating");
    const t0 = Date.now();
    setElapsedMs(0);
    stopClock();
    clockRef.current = window.setInterval(() => setElapsedMs(Date.now() - t0), 100);
    const stepStart: Partial<Record<StepId, number>> = {};

    const applyStep = (e: StepEvent) => {
      if (e.status === "start") stepStart[e.step] = Date.now();
      setSteps((prev) =>
        prev.map((s) => {
          if (s.id !== e.step) return s;
          if (e.status === "start") return { ...s, status: "active", detail: undefined };
          if (e.status === "info") return { ...s, detail: e.detail };
          return { ...s, status: "done", detail: e.detail, ms: Date.now() - (stepStart[e.step] ?? Date.now()) };
        }),
      );
    };

    try {
      const res = await fetch("/api/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => ({}))) as Partial<ForgeErrorState>;
        throw Object.assign(new Error(j.message ?? `HTTP ${res.status}`), { kind: j.kind ?? "api" });
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const chunk = await reader.read();
        done = chunk.done;
        buf += decoder.decode(chunk.value ?? new Uint8Array(), { stream: !done });
        let idx: number;
        while ((idx = buf.indexOf("\n\n")) >= 0) {
          const block = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          const ev = /^event: (.+)$/m.exec(block)?.[1];
          const data = /^data: (.+)$/m.exec(block)?.[1];
          if (!ev || !data) continue;
          const payload = JSON.parse(data);
          if (ev === "step") applyStep(payload as StepEvent);
          else if (ev === "result") { setDeck(payload as DeckResult); setPhase("result"); }
          else if (ev === "error") { setError(payload as ForgeErrorState); setPhase("idle"); }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError({ kind: ((err as { kind?: ErrorKind }).kind ?? "api"), message: (err as Error).message });
      setPhase("idle");
    } finally {
      stopClock();
      setElapsedMs(Date.now() - t0);
    }
  }, []);

  return { phase, steps, deck, error, elapsedMs, forge, cancel, reset, setDeck };
}
