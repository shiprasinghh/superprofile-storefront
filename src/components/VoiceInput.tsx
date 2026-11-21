"use client";

import { useEffect, useRef, useState } from "react";

const MAX_SECONDS = 45;
const TARGET_RATE = 16_000;

type State = "idle" | "recording" | "transcribing";

/**
 * Tap-to-talk for creators who'd rather speak than type (English, Hindi or
 * Hinglish). Records 16 kHz mono WAV with the Web Audio API — supported on
 * iOS Safari and Android Chrome alike — and sends it to /api/transcribe,
 * where Gemini turns it into text.
 */
export default function VoiceInput({ onText }: { onText: (text: string) => void }) {
  const [state, setState] = useState<State>("idle");
  const [secs, setSecs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const procRef = useRef<ScriptProcessorNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stoppingRef = useRef(false);

  useEffect(() => () => cleanup(), []);

  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    procRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => {});
    procRef.current = null;
    streamRef.current = null;
    ctxRef.current = null;
  }

  async function start() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Voice input isn't available in this browser. Please type instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const source = ctx.createMediaStreamSource(stream);
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      chunksRef.current = [];
      proc.onaudioprocess = (e) => {
        chunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      source.connect(proc);
      proc.connect(ctx.destination);
      ctxRef.current = ctx;
      streamRef.current = stream;
      procRef.current = proc;

      setSecs(0);
      setState("recording");
      const startedAt = Date.now();
      timerRef.current = setInterval(() => {
        const s = Math.floor((Date.now() - startedAt) / 1000);
        setSecs(s);
        if (s >= MAX_SECONDS) stop();
      }, 250);
    } catch {
      cleanup();
      setError("Allow microphone access to speak, or type instead.");
    }
  }

  async function stop() {
    if (!ctxRef.current || stoppingRef.current) return;
    stoppingRef.current = true;
    const rate = ctxRef.current.sampleRate;
    const chunks = chunksRef.current;
    cleanup();
    setState("transcribing");

    try {
      const samples = merge(chunks);
      if (samples.length < rate * 0.8) {
        throw new Error("That was too short. Tap the mic and speak for a few seconds.");
      }
      if (peak(samples) < 0.01) {
        throw new Error("We couldn't hear anything. Check your mic and try again.");
      }
      const wav = encodeWav(downsample(samples, rate, TARGET_RATE), TARGET_RATE);
      const audio = await blobToBase64(wav);
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio, mimeType: "audio/wav" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Couldn't understand that. Try again, or type instead.");
      }
      onText(data.text as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please type instead.");
    } finally {
      setState("idle");
      stoppingRef.current = false;
    }
  }

  const mmss = `0:${String(secs).padStart(2, "0")}`;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0 flex-1 text-xs" aria-live="polite">
        {state === "recording" && (
          <span className="flex items-center gap-1.5 font-medium text-rose-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
            Listening… {mmss} / 0:{MAX_SECONDS}
          </span>
        )}
        {state === "transcribing" && (
          <span className="flex items-center gap-1.5 text-violet-700">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
            Writing down what you said…
          </span>
        )}
        {state === "idle" &&
          (error ? (
            <span className="text-rose-600">{error}</span>
          ) : (
            <span className="text-gray-400">Type, or tap the mic and speak in English, Hindi or Hinglish</span>
          ))}
      </div>

      {state === "recording" ? (
        <button
          type="button"
          onClick={stop}
          aria-label="Stop recording"
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-rose-600 px-4 text-sm font-semibold text-white shadow-md"
        >
          <span className="h-2.5 w-2.5 rounded-sm bg-white" /> Stop
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={state === "transcribing"}
          aria-label="Speak instead of typing"
          title="Speak instead of typing"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white shadow-md transition hover:bg-violet-700 disabled:opacity-40"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <path d="M12 18v3" />
          </svg>
        </button>
      )}
    </div>
  );
}

function merge(chunks: Float32Array[]): Float32Array {
  const len = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Float32Array(len);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

function peak(samples: Float32Array): number {
  let max = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = Math.abs(samples[i]);
    if (v > max) max = v;
  }
  return max;
}

function downsample(samples: Float32Array, from: number, to: number): Float32Array {
  if (to >= from) return samples;
  const ratio = from / to;
  const out = new Float32Array(Math.floor(samples.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), samples.length);
    let sum = 0;
    for (let j = start; j < end; j++) sum += samples[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

function encodeWav(samples: Float32Array, rate: number): Blob {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + samples.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buf], { type: "audio/wav" });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(new Error("Couldn't read the recording."));
    r.readAsDataURL(blob);
  });
}
