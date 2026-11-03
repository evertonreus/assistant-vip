import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Pause, Play, Radar, Square, Volume2 } from "lucide-react";
import { Page, PageHeader } from "@/components/app/AppShell";
import { Markdown } from "@/components/renderer/Markdown";
import { getLatestCareerRadar, runCareerRadar } from "@/lib/career-radar.functions";

export const Route = createFileRoute("/career-radar")({
  head: () => ({
    meta: [
      { title: "Career Radar — Atlas" },
      { name: "description", content: "Run your private Career Radar and read or listen to the latest report." },
      { property: "og:title", content: "Career Radar — Atlas" },
      { property: "og:description", content: "Run your private Career Radar and read or listen to the latest report." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CareerRadarPage,
});

/** Turn any backend JSON into markdown for display. */
function toMarkdown(data: unknown, depth = 0): string {
  if (data == null) return "";
  if (typeof data === "string") return data;
  if (typeof data !== "object") return String(data);
  if (Array.isArray(data)) return data.map((d) => (typeof d === "object" ? toMarkdown(d, depth + 1) : `- ${String(d)}`)).join("\n\n");
  const obj = data as Record<string, unknown>;
  for (const k of ["report", "markdown", "content", "summary", "text", "message"]) {
    if (depth === 0 && typeof obj[k] === "string") return obj[k] as string;
  }
  return Object.entries(obj)
    .map(([k, v]) => {
      const title = k.replace(/[_-]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
      if (v && typeof v === "object") return `${"#".repeat(Math.min(depth + 3, 6))} ${title}\n\n${toMarkdown(v, depth + 1)}`;
      return `**${title}:** ${String(v)}`;
    })
    .join("\n\n");
}

function parse(t: string): unknown { try { return JSON.parse(t); } catch { return t; } }

function plainText(md: string) {
  return md.replace(/```[\s\S]*?```/g, "").replace(/https?:\/\/\S+/g, "").replace(/\[(.*?)\]\(.*?\)/g, "$1").replace(/[#*_>`|-]+/g, " ").replace(/\s+/g, " ").trim();
}

type Lang = "es" | "en" | "pt";
const LANGS: { value: Lang; label: string; locale: string }[] = [
  { value: "es", label: "Español", locale: "es-MX" },
  { value: "en", label: "English", locale: "en-US" },
  { value: "pt", label: "Português", locale: "pt-BR" },
];
const LANG_KEY = "career-radar-language";
const toLang = (v: unknown): Lang => (v === "en" || v === "pt" ? v : "es");

function pickVoice(synth: SpeechSynthesis, lang: Lang) {
  const locale = LANGS.find((l) => l.value === lang)!.locale.toLowerCase();
  const voices = synth.getVoices();
  return voices.find((v) => v.lang.toLowerCase().replace("_", "-") === locale) ?? voices.find((v) => v.lang.toLowerCase().startsWith(lang));
}

function ListenButton({ text, lang }: { text: string; lang: Lang }) {
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    setSupported(true);
    window.speechSynthesis.getVoices();
    return () => window.speechSynthesis.cancel();
  }, []);
  useEffect(() => { if (supported) { window.speechSynthesis.cancel(); setState("idle"); } }, [text, supported]);
  if (!supported) return null;
  const synth = window.speechSynthesis;
  const btn = "flex h-11 min-w-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-soft px-4 text-sm font-medium text-primary hover:opacity-80 sm:flex-none";
  const start = () => {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice(synth, lang);
    if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = LANGS.find((l) => l.value === lang)!.locale;
    u.onend = () => setState("idle");
    u.onerror = () => setState("idle");
    synth.speak(u);
    setState("playing");
  };
  return (
    <div className="flex w-full gap-2 sm:w-auto">
      <button onClick={start} className={btn} aria-label="Listen to briefing"><Volume2 className="size-4" />Listen</button>
      {state === "playing" && <button onClick={() => { synth.pause(); setState("paused"); }} className={btn} aria-label="Pause"><Pause className="size-4" />Pause</button>}
      {state === "paused" && <button onClick={() => { synth.resume(); setState("playing"); }} className={btn} aria-label="Resume"><Play className="size-4" />Resume</button>}
      {state !== "idle" && <button onClick={() => { synth.cancel(); setState("idle"); }} className={btn} aria-label="Stop"><Square className="size-4" />Stop</button>}
    </div>
  );
}

function CareerRadarPage() {
  const run = useServerFn(runCareerRadar);
  const loadLatest = useServerFn(getLatestCareerRadar);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [audioText, setAudioText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Lang>("es");
  const [audioLang, setAudioLang] = useState<Lang>("es");
  const ranRef = useRef(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  useEffect(() => { setLanguage(toLang(localStorage.getItem(LANG_KEY))); }, []);
  const changeLanguage = (l: Lang) => { setLanguage(l); localStorage.setItem(LANG_KEY, l); };

  const applyResult = (raw: string, fallbackLang: Lang, saved: boolean) => {
    const parsed = parse(raw);
    const obj = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
    if (saved && (!obj || obj["ok"] === false || typeof obj["report"] !== "string" || !obj["report"].trim())) return false;
    const md = (obj && typeof obj["report"] === "string" ? obj["report"] : toMarkdown(parsed)) || "The report came back empty.";
    setReport(md);
    setAudioLang(obj && typeof obj["language"] === "string" ? toLang(obj["language"]) : fallbackLang);
    setAudioText(obj && typeof obj["audioText"] === "string" && obj["audioText"].trim() ? obj["audioText"] : plainText(md));
    setGeneratedAt(obj && typeof obj["generatedAt"] === "string" ? obj["generatedAt"] : saved ? null : new Date().toISOString());
    return true;
  };

  useEffect(() => {
    let active = true;
    loadLatest()
      .then((res) => { if (active && !ranRef.current && res.ok && res.data.trim()) applyResult(res.data, "es", true); })
      .catch(() => {});
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRun = async () => {
    if (loading) return;
    ranRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await run({ data: { language } });
      if (res.ok) applyResult(res.data, language, false);
      else setError(res.error);
    } catch {
      setError("Something went wrong running Career Radar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <PageHeader title="Career Radar" description="Scan the market for opportunities that match your profile." />
      <section className="rounded-3xl border bg-surface p-5 shadow-soft">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><Radar className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold">Run a fresh scan</p>
            <p className="text-sm text-muted-foreground">This can take a minute.</p>
          </div>
          <select value={language} onChange={(e) => changeLanguage(toLang(e.target.value))} disabled={loading} aria-label="Report language" className="h-10 w-full rounded-xl border bg-background px-3 text-sm sm:w-auto">
            {LANGS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <button onClick={onRun} disabled={loading} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-float disabled:opacity-60 sm:w-auto">
            {loading ? <><Loader2 className="size-4 animate-spin" />Running…</> : <><Radar className="size-4" />Run Career Radar</>}
          </button>
        </div>
        {error && <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      </section>
      {report && (
        <section className="animate-rise mt-4 rounded-3xl border bg-surface p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-display font-semibold">Report</p>
              {generatedAt && !isNaN(Date.parse(generatedAt)) && (
                <p className="text-xs text-muted-foreground">Generated {new Date(generatedAt).toLocaleString()}</p>
              )}
            </div>
            {audioText && <ListenButton text={audioText} lang={audioLang} />}
          </div>
          <div className="break-words text-sm"><Markdown>{report}</Markdown></div>
        </section>
      )}
    </Page>
  );
}
