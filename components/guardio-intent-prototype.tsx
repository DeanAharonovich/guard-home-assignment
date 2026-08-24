"use client";

import type { ReactNode } from "react";
import { useState, useEffect, useRef } from "react";
import {
  RotateCcw, Trash2, ChevronDown, ChevronUp, Check,
  FileText, FileArchive, Terminal, Smartphone, Wifi, BatteryFull, AlertCircle, Star,
} from "lucide-react";

// ---------------------------------------------------------------------------
// DEFAULT CONFIG — schema from Part 2, extended with `scanTransition` (the
// loading/personalizing beat), `statVisual.countUp`, and `statVisual.highlightIndex`
// (which bar/icon to call out). Everything the phone renders comes from this
// object (or whatever is pasted into the Config tab).
// ---------------------------------------------------------------------------
const DEFAULT_CONFIG = {
  configId: "intent_screen_v3",
  configVersion: 3,
  theme: "dark_blue",
  showProgressBar: true,
  title: "1 in 5 sites you visit are malicious",
  body: "Fake shopping, banking, and more sites trick millions into giving away sensitive information. These sites are designed to look identical to the real thing, and most people never suspect a thing.",
  ctaLabel: "Continue",
  intentPageSections: ["title", "body", "stat_visual"],
  statVisual: {
    type: "bar_chart",
    xAxisLabels: ["1", "2", "3", "4", "5", "6", "7"],
    highlightIndex: 4,
    headline: { prefix: "1 in ", value: 5, suffix: "" },
    countUp: { enabled: true, durationMs: 900, from: 0 },
  },
  scanTransition: {
    enabled: true,
    durationMs: 1800,
    copy: "Personalizing your protection...",
    style: "loading_ring",
  },
  selection: {
    sourceProperty: "selected_feature_type",
    sourceStep: "onboarding_preferences",
  },
  variants: {
    file_downloads: {
      title: "1 in 4 downloads hides malware",
      body: "PDFs, installers, and zip files are one of the easiest ways attackers slip malware onto your device \u2014 often disguised as something you were already expecting.",
      statVisual: {
        type: "icon_grid",
        icons: ["pdf", "zip", "exe", "apk"],
        highlightIndex: 1,
        headline: { prefix: "1 in ", value: 4, suffix: "" },
        countUp: { enabled: true, durationMs: 900, from: 0 },
      },
    },
    site_legitimacy: {
      title: "1 in 5 sites you visit are malicious",
      body: "Fake shopping, banking, and more sites trick millions into giving away sensitive information. These sites are designed to look identical to the real thing, and most people never suspect a thing.",
      statVisual: {
        type: "bar_chart",
        xAxisLabels: ["1", "2", "3", "4", "5", "6", "7"],
        highlightIndex: 4,
        headline: { prefix: "1 in ", value: 5, suffix: "" },
        countUp: { enabled: true, durationMs: 900, from: 0 },
      },
    },
    trust_reviews: {
      title: "60% of \u2018verified\u2019 reviews are fake",
      body: "Scammers buy fake five-star reviews to make malicious products and sites look trustworthy \u2014 the badge you rely on can be gamed.",
      statVisual: {
        type: "comparison_bar",
        labels: ["Real", "Fake"],
        values: [40, 60],
        headline: { prefix: "", value: 60, suffix: "% fake" },
        countUp: { enabled: true, durationMs: 900, from: 0 },
      },
    },
  },
  analytics: {
    exposureEvent: "dynamic_feature_info_viewed",
    ctaEvent: "dynamic_feature_info_continued",
    scanEvent: "dynamic_feature_info_scan_started",
  },
};

const FALLBACK_CONFIG = {
  title: "Browse the web more safely",
  body: "Guardio checks the sites you visit against known threat lists in real time, before you ever land on them.",
  ctaLabel: "Continue",
  showProgressBar: true,
  statVisual: {
    type: "bar_chart",
    xAxisLabels: ["1", "2", "3", "4", "5", "6", "7"],
    highlightIndex: -1,
    headline: { prefix: "", value: 0, suffix: "" },
    countUp: { enabled: false },
  },
};

// Order + copy matches the provided mock exactly.
const PREFERENCE_OPTIONS = [
  { id: "site_legitimacy", label: "Knowing a site is legitimate" },
  { id: "trust_reviews", label: "Trusting reviews & recommendations" },
  { id: "file_downloads", label: "Downloading files safely" },
];

const ICON_MAP = { pdf: FileText, zip: FileArchive, exe: Terminal, apk: Smartphone };
const STEPS = ["preference", "scan", "intent", "setup"];
const STEP_LABELS = { preference: "Preference", scan: "Loading", intent: "Personalized intent", setup: "Setup ask" };
const CONSOLE_BODY_H = 420;

function mergeVariant(config: any, featureId: string | null) {
  const variant = config?.variants?.[featureId ?? ""];
  if (!variant) return config;
  return {
    ...config,
    ...variant,
    statVisual: variant.statVisual ? { ...config.statVisual, ...variant.statVisual } : config.statVisual,
  };
}

function useCountUp(target: number, durationMs: number, active: boolean) {
  const [val, setVal] = useState(active ? 0 : target);
  useEffect(() => {
    if (!active) {
      setVal(target);
      return;
    }
    let raf: number;
    let start: number | null = null;
    setVal(0);
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / Math.max(durationMs, 1), 1);
      setVal(Math.round(progress * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs, active]);
  return val;
}

// Ascending bars (sky blue, brightening toward the right) like the mock's
// trend illustration. The `highlightIndex` bar breaks from that palette into
// a warm alert red/amber with a soft glow — the one restrained "alerting"
// touch, everything else stays aligned to the reference design.
function BarChart({ xAxisLabels = [], highlightIndex = -1 }: { xAxisLabels?: string[]; highlightIndex?: number }) {
  const count = xAxisLabels.length || 1;
  const heights = xAxisLabels.map((_, i) => 20 + (i + 1) * (60 / count));
  return (
    <div className="mt-5">
      <div className="flex items-end gap-2 h-24">
        {heights.map((h, i) => {
          const hot = i === highlightIndex;
          const opacity = 0.35 + (i / Math.max(count - 1, 1)) * 0.65;
          return (
            <div key={i} className="flex-1 h-full flex items-end">
              <div
                className="w-full rounded-t-sm"
                style={{
                  height: `${h}%`,
                  background: hot ? "linear-gradient(180deg, #fb923c, #ef4444)" : "#7dd3fc",
                  opacity: hot ? 1 : opacity,
                  boxShadow: hot ? "0 0 14px rgba(239,68,68,0.6)" : "none",
                  animation: `barGrow 650ms cubic-bezier(0.22,1,0.36,1) ${i * 55}ms both${hot ? ", pulseGlow 1.8s ease-out 700ms infinite" : ""}`,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-1.5">
        {xAxisLabels.map((l, i) => (
          <span
            key={i}
            className="flex-1 text-[9px] text-center"
            style={{ color: i === highlightIndex ? "#fca5a5" : "rgba(255,255,255,0.4)", fontWeight: i === highlightIndex ? 700 : 400 }}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function IconGrid({ icons = [], highlightIndex = -1 }: { icons?: string[]; highlightIndex?: number }) {
  return (
    <div className="flex gap-3 mt-5">
      {icons.map((key, i) => {
        const Ico = ICON_MAP[key as keyof typeof ICON_MAP] || FileText;
        const hot = i === highlightIndex;
        return (
          <div
            key={i}
            className="flex-1 aspect-square rounded-xl flex items-center justify-center border"
            style={{
              background: hot ? "rgba(239,68,68,0.16)" : "rgba(125,211,252,0.10)",
              borderColor: hot ? "rgba(239,68,68,0.7)" : "rgba(125,211,252,0.3)",
              animation: hot
                ? `popIn 400ms ease-out ${i * 90}ms both, pulseRing 1.8s ease-out 500ms infinite`
                : `popIn 400ms ease-out ${i * 90}ms both`,
            }}
          >
            <Ico size={20} color={hot ? "#f87171" : "#7dd3fc"} />
          </div>
        );
      })}
    </div>
  );
}

function ComparisonBar({ labels = [], values = [] }: { labels?: string[]; values?: number[] }) {
  return (
    <div className="mt-5 space-y-2.5">
      {labels.map((label, i) => {
        const danger = i === 1;
        return (
          <div key={i}>
            <div className="flex justify-between text-[11px] mb-1" style={{ color: danger ? "#fca5a5" : "rgba(255,255,255,0.55)" }}>
              <span className="font-medium">{label}</span>
              <span className="font-medium">{values[i]}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${values[i]}%`,
                  background: danger ? "linear-gradient(90deg, #ef4444, #fb923c)" : "#7dd3fc",
                  boxShadow: danger ? "0 0 8px rgba(239,68,68,0.5)" : "none",
                  animation: `barGrowX 700ms ease-out ${i * 120}ms both`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatVisual({ sv }: { sv: any }) {
  if (!sv) return null;
  const target = sv.headline?.value ?? 0;
  const durationMs = sv.countUp?.durationMs ?? 800;
  const active = sv.countUp?.enabled !== false;
  const count = useCountUp(target, durationMs, active);
  const prefix = sv.headline?.prefix ?? "";
  const suffix = sv.headline?.suffix ?? "";
  return (
    <div>
      {sv.type === "bar_chart" && <BarChart xAxisLabels={sv.xAxisLabels} highlightIndex={sv.highlightIndex} />}
      {sv.type === "icon_grid" && <IconGrid icons={sv.icons} highlightIndex={sv.highlightIndex} />}
      {sv.type === "comparison_bar" && <ComparisonBar labels={sv.labels} values={sv.values} />}
    </div>
  );
}

function StatusBar({ dark }: { dark: boolean }) {
  const c = dark ? "#ffffff" : "#000000";
  return (
    <div className="flex items-center justify-between px-6 pt-1 pb-1.5 text-[12px] font-semibold shrink-0" style={{ color: c }}>
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <div className="flex items-end gap-[1.5px] h-2.5">
          <div style={{ width: 2.5, height: "40%", background: c, borderRadius: 1 }} />
          <div style={{ width: 2.5, height: "60%", background: c, borderRadius: 1 }} />
          <div style={{ width: 2.5, height: "80%", background: c, borderRadius: 1 }} />
          <div style={{ width: 2.5, height: "100%", background: c, borderRadius: 1 }} />
        </div>
        <Wifi size={13} color={c} />
        <BatteryFull size={16} color={c} />
      </div>
    </div>
  );
}

function ProgressBar({ stepIndex, dark }: { stepIndex: number; dark: boolean }) {
  const pct = ((stepIndex + 1) / STEPS.length) * 100;
  return (
    <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: dark ? "rgba(255,255,255,0.18)" : "#e5e7eb" }}>
      <div className="h-full transition-all duration-500 ease-out" style={{ width: `${pct}%`, background: dark ? "#ffffff" : "#000000" }} />
    </div>
  );
}

function LoadingRing() {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: "#e5e7eb" }} />
      <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#000000", borderTopColor: "transparent" }} />
    </div>
  );
}

// Fixed-size device chrome (never resizes between steps). Background,
// status-bar, and progress-bar colors flip between the light theme (used on
// every screen except the personalized intent screen) and the dark navy used
// there, matching the reference mocks.
const PHONE_W = 320;
const PHONE_H = 660;
const PHONE_PAD = 10;

function PhoneFrame({
  dark,
  stepIndex,
  showProgress,
  onRestart,
  children,
}: {
  dark: boolean;
  stepIndex: number;
  showProgress: boolean;
  onRestart: () => void;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        width: PHONE_W,
        height: PHONE_H,
        borderRadius: 46,
        padding: PHONE_PAD,
        background: "linear-gradient(160deg, #ffffff 0%, #e2e8f0 70%)",
        boxShadow: "0 24px 50px -18px rgba(15,23,42,0.35), 0 0 0 1px rgba(15,23,42,0.06)",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      <div style={{ position: "absolute", left: -3, top: 92, width: 3, height: 28, borderRadius: 2, background: "#cbd5e1" }} />
      <div style={{ position: "absolute", left: -3, top: 130, width: 3, height: 46, borderRadius: 2, background: "#cbd5e1" }} />
      <div style={{ position: "absolute", right: -3, top: 118, width: 3, height: 58, borderRadius: 2, background: "#cbd5e1" }} />

      <div
        style={{
          borderRadius: 38,
          overflow: "hidden",
          background: dark ? "#0d1b42" : "#ffffff",
          transition: "background-color 350ms ease",
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
            width: 84, height: 22, borderRadius: 20, background: "#000", zIndex: 10,
          }}
        />
        <div style={{ paddingTop: 20, flexShrink: 0 }}>
          <StatusBar dark={dark} />
          <div className="px-5 pt-2 pb-1 flex items-center justify-between">
            {showProgress ? <ProgressBar stepIndex={stepIndex} dark={dark} /> : <div className="h-1" />}
            <button
              onClick={onRestart}
              className="ml-3 shrink-0 transition-opacity hover:opacity-70"
              style={{ color: dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.4)" }}
              title="Restart flow"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>{children}</div>
        <div style={{ display: "flex", justifyContent: "center", paddingBottom: 8, paddingTop: 4, flexShrink: 0 }}>
          <div style={{ width: 110, height: 4, borderRadius: 4, background: dark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.2)" }} />
        </div>
      </div>
    </div>
  );
}

// Three interchangeable "here's what we caught" illustrations for the setup
// step. Which one renders depends on what the user picked in the preference
// step, so the closing screen echoes their specific concern.
function AlertToast({
  top,
  bottom,
  left = 6,
  width = 138,
  icon,
  text,
}: {
  top?: number;
  bottom?: number;
  left?: number;
  width?: number;
  icon: ReactNode;
  text: ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute", left, top, bottom, width, padding: "8px 10px", background: "#fff",
        borderRadius: 12, boxShadow: "0 10px 24px rgba(15,23,42,0.18)", display: "flex", gap: 6, alignItems: "flex-start",
      }}
    >
      {icon}
      <span style={{ fontSize: 9.5, color: "#0f172a", fontWeight: 600, lineHeight: 1.35 }}>{text}</span>
    </div>
  );
}

function SiteBlockedGraphic() {
  return (
    <div className="relative mx-auto mb-2" style={{ width: 176, height: 176 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 28, background: "#f1f5f9", border: "1px solid #e2e8f0" }} />
      <div style={{ position: "absolute", left: "50%", top: 14, transform: "translateX(-50%)", width: 76, height: 130, borderRadius: 16, background: "#0f172a" }} />
      <div style={{ position: "absolute", left: "50%", top: 38, transform: "translateX(-50%)", width: 56, height: 14, borderRadius: 6, background: "#fbbf24" }} />
      <div style={{ position: "absolute", left: "50%", top: 108, transform: "translateX(-50%)", width: 56, height: 14, borderRadius: 6, background: "#334155" }} />
      <AlertToast
        top={46}
        width={138}
        icon={<AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />}
        text={<>Guardio blocked this site because <span style={{ color: "#ef4444" }}>it's malicious</span></>}
      />
    </div>
  );
}

function ReviewFlaggedGraphic() {
  return (
    <div className="relative mx-auto mb-2" style={{ width: 176, height: 176 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 28, background: "#f1f5f9", border: "1px solid #e2e8f0" }} />
      <div
        style={{
          position: "absolute", left: "50%", top: 14, transform: "translateX(-50%)", width: 136, borderRadius: 14,
          background: "#fff", padding: "12px 12px 14px", boxShadow: "0 4px 10px rgba(15,23,42,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#cbd5e1" }} />
          <div style={{ width: 54, height: 6, borderRadius: 3, background: "#e2e8f0" }} />
        </div>
        <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={11} fill="#fbbf24" color="#fbbf24" />
          ))}
        </div>
        <div style={{ width: "100%", height: 6, borderRadius: 3, background: "#e2e8f0", marginBottom: 5 }} />
        <div style={{ width: "68%", height: 6, borderRadius: 3, background: "#e2e8f0" }} />
      </div>
      <AlertToast
        bottom={6}
        width={150}
        icon={<AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />}
        text={<>Guardio flagged this review &mdash; <span style={{ color: "#ef4444" }}>likely not trustworthy</span></>}
      />
    </div>
  );
}

function FileBlockedGraphic() {
  return (
    <div className="relative mx-auto mb-2" style={{ width: 176, height: 176 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 28, background: "#f1f5f9", border: "1px solid #e2e8f0" }} />
      <div
        style={{
          position: "absolute", left: "50%", top: 18, transform: "translateX(-50%)", width: 108, borderRadius: 14,
          background: "#fff", padding: "14px 10px", boxShadow: "0 4px 10px rgba(15,23,42,0.06)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        }}
      >
        <div style={{ width: 42, height: 50, borderRadius: 6, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FileText size={20} color="#ef4444" />
        </div>
        <div style={{ width: 64, height: 6, borderRadius: 3, background: "#e2e8f0" }} />
        <div style={{ width: 40, height: 6, borderRadius: 3, background: "#e2e8f0" }} />
      </div>
      <AlertToast
        bottom={6}
        width={150}
        icon={<AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />}
        text={<>Guardio blocked this download &mdash; <span style={{ color: "#ef4444" }}>it's not safe</span></>}
      />
    </div>
  );
}

const SETUP_GRAPHICS = {
  site_legitimacy: SiteBlockedGraphic,
  trust_reviews: ReviewFlaggedGraphic,
  file_downloads: FileBlockedGraphic,
};

export default function GuardioIntentPrototype() {
  const [step, setStep] = useState<string>("preference");
  const [pendingPreference, setPendingPreference] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const [configText, setConfigText] = useState(() => JSON.stringify(DEFAULT_CONFIG, null, 2));
  const [configObj, setConfigObj] = useState<any>(DEFAULT_CONFIG);
  const [configError, setConfigError] = useState<string | null>(null);

  const [simulateFailureDraft, setSimulateFailureDraft] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);

  type EventLogEntry = { id: string; ts: Date; name: string; props: Record<string, unknown> };
  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const [debugTab, setDebugTab] = useState("events");
  const [debugOpen, setDebugOpen] = useState(true);
  const logRef = useRef<HTMLDivElement>(null);

  // Derived (not stored) so config/failure-flag edits reflect on whatever
  // screen is showing right now, immediately.
  const activeConfig = !selectedFeature
    ? null
    : simulateFailure
    ? FALLBACK_CONFIG
    : mergeVariant(configObj, selectedFeature);
  const usedFallback = simulateFailure;

  const addEvent = (name: string, props?: Record<string, unknown>) => {
    setEvents((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, ts: new Date(), name, props: props || {} }]);
  };

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [events]);

  useEffect(() => {
    if (step !== "scan") return;
    const duration = configObj?.scanTransition?.durationMs ?? 1800;
    const timer = setTimeout(() => {
      const exposureEvent = configObj?.analytics?.exposureEvent || "dynamic_feature_info_viewed";
      if (simulateFailure) {
        addEvent("config_load_failed", { selected_feature_type: selectedFeature, reason: "simulated_network_error" });
      }
      addEvent(exposureEvent, { selected_feature_type: selectedFeature, has_graph: true, used_fallback: simulateFailure });
      setStep("intent");
    }, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleContinueFromPreference = () => {
    if (!pendingPreference) return;
    setSelectedFeature(pendingPreference);
    addEvent("onboarding_preferences_continued", { selected_options: [pendingPreference] });
    const scanEvent = configObj?.analytics?.scanEvent || "dynamic_feature_info_scan_started";
    addEvent(scanEvent, { selected_feature_type: pendingPreference, duration_ms: configObj?.scanTransition?.durationMs ?? 1800 });
    setStep("scan");
  };

  const handleContinueFromIntent = () => {
    const ctaEvent = configObj?.analytics?.ctaEvent || "dynamic_feature_info_continued";
    addEvent(ctaEvent, { selected_feature_type: selectedFeature });
    addEvent("protection_setup_viewed", {});
    setStep("setup");
  };

  const handleSetupClick = () => addEvent("protection_setup_clicked", { action: "set_up" });
  const handleSkipSetup = () => addEvent("protection_setup_clicked", { action: "skip" });

  const handleRestart = () => {
    setStep("preference");
    setSelectedFeature(null);
    setPendingPreference(null);
  };

  const handleApplyConfig = () => {
    let parsed;
    try {
      parsed = JSON.parse(configText);
      setConfigError(null);
    } catch (e) {
      setConfigError(e instanceof Error ? e.message : "Invalid JSON");
      return;
    }
    setConfigObj(parsed);
    setSimulateFailure(simulateFailureDraft);
    if (selectedFeature) {
      const exposureEvent = parsed?.analytics?.exposureEvent || "dynamic_feature_info_viewed";
      if (simulateFailureDraft) {
        addEvent("config_load_failed", { selected_feature_type: selectedFeature, reason: "simulated_network_error", trigger: "config_applied" });
      }
      addEvent(exposureEvent, { selected_feature_type: selectedFeature, used_fallback: simulateFailureDraft, trigger: "config_applied" });
    }
  };

  const handleResetConfig = () => {
    setConfigText(JSON.stringify(DEFAULT_CONFIG, null, 2));
    setConfigObj(DEFAULT_CONFIG);
    setConfigError(null);
    setSimulateFailureDraft(false);
    setSimulateFailure(false);
  };

  const stepIndex = STEPS.indexOf(step);
  const showProgress = configObj?.showProgressBar !== false;
  const isDarkScreen = step === "intent";

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-8 px-4" style={{ background: "#e5e7eb" }}>
      <style>{`
        @keyframes barGrow { from { height: 0%; } }
        @keyframes barGrowX { from { width: 0%; } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseRing { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.45);} 70% { box-shadow: 0 0 0 8px rgba(239,68,68,0);} 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0);} }
        @keyframes pulseGlow { 0% { box-shadow: 0 0 14px rgba(239,68,68,0.55);} 50% { box-shadow: 0 0 22px rgba(239,68,68,0.85);} 100% { box-shadow: 0 0 14px rgba(239,68,68,0.55);} }
      `}</style>

      <div className="w-full max-w-6xl mb-6 text-center">
        <h1 className="text-xl font-bold text-slate-900">Personalized Intent Prototype</h1>
      </div>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 items-start justify-center">
        {/* PHONE */}
        <div className="mx-auto">
          <PhoneFrame dark={isDarkScreen} stepIndex={stepIndex} showProgress={showProgress} onRestart={handleRestart}>
            <div className="px-6 pb-6 pt-3 flex-1 flex flex-col" key={step + "-" + (selectedFeature || "")}>
              {step === "preference" && (
                <div className="flex-1 flex flex-col" style={{ animation: "fadeSlide 350ms ease-out both" }}>
                  <h2 className="text-2xl font-bold text-black leading-snug mb-6">What would help you feel more confident while browsing</h2>
                  <div className="space-y-3">
                    {PREFERENCE_OPTIONS.map(({ id, label }) => {
                      const checked = pendingPreference === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setPendingPreference(id)}
                          className="w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-colors"
                          style={{ borderColor: checked ? "#000" : "#e2e8f0", background: "#fff" }}
                        >
                          <span className="text-sm font-medium text-black">{label}</span>
                          <span
                            className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ml-3"
                            style={{ background: checked ? "#000" : "#fff", borderColor: checked ? "#000" : "#cbd5e1" }}
                          >
                            {checked && <Check size={13} color="#fff" strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex-1" />
                  <button
                    onClick={handleContinueFromPreference}
                    disabled={!pendingPreference}
                    className="w-full mt-6 py-3.5 rounded-full font-semibold transition-opacity"
                    style={{ background: "#000", color: "#fff", opacity: pendingPreference ? 1 : 0.35 }}
                  >
                    Continue
                  </button>
                </div>
              )}

              {step === "scan" && (
                <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ animation: "fadeSlide 350ms ease-out both" }}>
                  <LoadingRing />
                  <p className="text-black font-semibold mt-5">{configObj?.scanTransition?.copy || "Personalizing your protection..."}</p>
                  <p className="text-xs text-slate-500 mt-1">Matching results to what you picked</p>
                </div>
              )}

              {step === "intent" && activeConfig && (
                <div style={{ animation: "fadeSlide 350ms ease-out both" }}>
                  {usedFallback && (
                    <div className="mb-3 text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1.5">
                      Config failed to load &mdash; showing fallback content
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-white leading-snug mb-3">{activeConfig.title}</h2>
                  <p className="text-sm leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.65)" }}>{activeConfig.body}</p>
                  <StatVisual sv={activeConfig.statVisual} />
                  <div className="flex-1" />
                  <button
                    onClick={handleContinueFromIntent}
                    className="w-full mt-6 py-3.5 rounded-full font-semibold"
                    style={{ background: "#fff", color: "#000" }}
                  >
                    {activeConfig.ctaLabel || "Continue"}
                  </button>
                </div>
              )}

              {step === "setup" && (
                <div className="flex-1 flex flex-col" style={{ animation: "fadeSlide 350ms ease-out both" }}>
                  {(() => {
                    const Graphic =
                      SETUP_GRAPHICS[selectedFeature as keyof typeof SETUP_GRAPHICS] || SiteBlockedGraphic;
                    return <Graphic />;
                  })()}
                  <h2 className="text-2xl font-bold text-black text-center leading-snug mb-2 mt-2">Browsing Protection</h2>
                  <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">
                    We block dangerous websites, warn you before you enter risky pages and help you spot unreliable content.
                  </p>
                  <div className="flex-1" />
                  <button
                    onClick={handleSetupClick}
                    className="w-full py-3.5 rounded-full font-semibold"
                    style={{ background: "#000", color: "#fff" }}
                  >
                    Set up
                  </button>
                  <button onClick={handleSkipSetup} className="w-full py-3 text-sm font-medium text-slate-500">
                    Continue without protection
                  </button>
                </div>
              )}
            </div>
          </PhoneFrame>

          <div className="flex items-center justify-center gap-2 mt-5 flex-wrap" style={{ width: PHONE_W }}>
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${i <= stepIndex ? "bg-blue-600" : "bg-slate-300"}`} />
                <span className={`text-[10px] ${i <= stepIndex ? "text-slate-600" : "text-slate-400"}`}>
                  {STEP_LABELS[s as keyof typeof STEP_LABELS]}
                </span>
                {i < STEPS.length - 1 && <span className="text-slate-300 mx-0.5">&middot;</span>}
              </div>
            ))}
          </div>
        </div>

        {/* DEBUG CONSOLE */}
        <div className="w-full lg:w-[420px] rounded-2xl border border-slate-800 bg-black overflow-hidden font-mono shadow-2xl">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              </div>
              <span className="text-xs text-slate-400 ml-2">debug console</span>
            </div>
            <button onClick={() => setDebugOpen((o) => !o)} className="text-slate-500 hover:text-slate-300">
              {debugOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {debugOpen && (
            <>
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => setDebugTab("events")}
                  className={`flex-1 text-xs py-2.5 transition-colors ${debugTab === "events" ? "text-cyan-400 bg-slate-900/60" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Event Log ({events.length})
                </button>
                <button
                  onClick={() => setDebugTab("config")}
                  className={`flex-1 text-xs py-2.5 transition-colors ${debugTab === "config" ? "text-cyan-400 bg-slate-900/60" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Config
                </button>
              </div>

              {debugTab === "events" && (
                <div style={{ height: CONSOLE_BODY_H }} className="flex flex-col">
                  <div ref={logRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2.5 text-[11px]">
                    {events.length === 0 && <p className="text-slate-600">No events yet &mdash; interact with the phone to fire some.</p>}
                    {events.map((ev) => (
                      <div key={ev.id} className="border-l-2 border-emerald-500/50 pl-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-slate-600">{ev.ts.toLocaleTimeString([], { hour12: false })}.{String(ev.ts.getMilliseconds()).padStart(3, "0")}</span>
                          <span className="text-emerald-400 font-semibold">{ev.name}</span>
                        </div>
                        {Object.keys(ev.props).length > 0 && (
                          <pre className="text-slate-500 whitespace-pre-wrap break-words mt-0.5">{JSON.stringify(ev.props, null, 0)}</pre>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-end border-t border-slate-800 px-3 py-2 shrink-0">
                    <button onClick={() => setEvents([])} className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-rose-400 transition-colors">
                      <Trash2 size={12} /> Clear
                    </button>
                  </div>
                </div>
              )}

              {debugTab === "config" && (
                <div style={{ height: CONSOLE_BODY_H }} className="flex flex-col p-3">
                  <p className="text-[10px] text-slate-500 mb-2 shrink-0">
                    Edit <span className="text-cyan-400">title</span>, <span className="text-cyan-400">ctaLabel</span>, a variant's{" "}
                    <span className="text-cyan-400">statVisual</span>, etc. &mdash; then Apply. Updates the current screen live.
                  </p>
                  <textarea
                    value={configText}
                    onChange={(e) => setConfigText(e.target.value)}
                    className="w-full flex-1 min-h-0 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-[10px] text-slate-300 focus:outline-none focus:border-cyan-400/60 resize-none"
                    spellCheck={false}
                  />
                  {configError && <p className="text-[10px] text-rose-400 mt-1.5 shrink-0">{configError}</p>}
                  <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer mt-2.5 shrink-0">
                    <input type="checkbox" checked={simulateFailureDraft} onChange={(e) => setSimulateFailureDraft(e.target.checked)} />
                    Simulate config load failure (renders fallback content)
                  </label>
                  <div className="flex gap-2 mt-2.5 shrink-0">
                    <button onClick={handleApplyConfig} className="flex-1 text-xs py-2 rounded-lg bg-cyan-400 text-slate-950 font-semibold hover:bg-cyan-300 transition-colors">
                      Apply
                    </button>
                    <button onClick={handleResetConfig} className="flex-1 text-xs py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
                      Reset to default
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
