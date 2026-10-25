"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, Scheme } from "@/lib/api";
import { useLang } from "@/lib/i18n";

// ─── Types ────────────────────────────────────────────────────────────────────
type AssistantLang = "en" | "ta" | "hi" | "te";
type Msg = {
  role: "user" | "assistant";
  content: string;
  schemes?: Scheme[];
  usedLlm?: boolean;
};

// ─── Language config ──────────────────────────────────────────────────────────
const ASSISTANT_LANGS: { code: AssistantLang; label: string; native: string; bcp47: string }[] = [
  { code: "en", label: "English", native: "English", bcp47: "en-IN" },
  { code: "ta", label: "Tamil", native: "தமிழ்", bcp47: "ta-IN" },
  { code: "hi", label: "Hindi", native: "हिन्दी", bcp47: "hi-IN" },
  { code: "te", label: "Telugu", native: "తెలుగు", bcp47: "te-IN" },
];

const UI: Record<AssistantLang, {
  eyebrow: string; heading: string; intro: string;
  placeholder: string; send: string; listening: string;
  micTitle: string; stopTitle: string; speakTitle: string;
  tryThese: string; q1: string; q2: string; q3: string;
  searching: string; aiLabel: string; retrievalLabel: string;
  langLabel: string; permDenied: string; noSupport: string;
  recogError: string; editHint: string;
}> = {
  en: {
    eyebrow: "Grounded assistant · Voice enabled",
    heading: "Ask the Assistant",
    intro: "Ask in plain words, like \"I am a farmer, what can I get?\" Answers are grounded only in the scheme database. Speak or type in any of the 4 supported languages.",
    placeholder: "Ask about any scheme…",
    send: "Send",
    listening: "Listening…",
    micTitle: "Start voice input",
    stopTitle: "Stop recording",
    speakTitle: "Read answer aloud",
    tryThese: "Try one of these",
    q1: "I'm a street vendor, what loans can I get?",
    q2: "Scholarships for girl students in engineering",
    q3: "Pension schemes for farmers",
    searching: "Searching schemes…",
    aiLabel: "AI-generated answer",
    retrievalLabel: "Simple search, no AI key set",
    langLabel: "Assistant language",
    permDenied: "Microphone access was denied. Please allow microphone permission in your browser settings.",
    noSupport: "Voice input is not supported in this browser. Please use Chrome or Edge.",
    recogError: "Could not recognise speech. Please try again or type your question.",
    editHint: "Review & edit before sending",
  },
  ta: {
    eyebrow: "நம்பகமான AI உதவியாளர் · குரல் ஆதரவு",
    heading: "உதவியாளரிடம் கேளுங்கள்",
    intro: "\"நான் ஒரு விவசாயி, எனக்கு என்ன கிடைக்கும்?\" என்று எளிமையாகக் கேளுங்கள். பதில்கள் அதிகாரப்பூர்வ திட்டத் தரவுகளிலிருந்து மட்டுமே.",
    placeholder: "எந்த திட்டத்தைப் பற்றியும் கேளுங்கள்…",
    send: "அனுப்புக",
    listening: "கேட்கிறது…",
    micTitle: "குரல் உள்ளீட்டைத் தொடங்கவும்",
    stopTitle: "பதிவை நிறுத்தவும்",
    speakTitle: "பதிலை சத்தமாகப் படிக்கவும்",
    tryThese: "இவற்றில் ஒன்றை முயற்சிக்கவும்",
    q1: "நான் தெருவோர வியாபாரி, எனக்கு என்ன கடன் கிடைக்கும்?",
    q2: "பொறியியல் படிக்கும் மாணவிகளுக்கான கல்வி உதவித்தொகை",
    q3: "விவசாயிகளுக்கான ஓய்வூதியத் திட்டங்கள்",
    searching: "திட்டங்களைத் தேடுகிறது…",
    aiLabel: "AI உருவாக்கிய பதில்",
    retrievalLabel: "நேரடித் தேடல் முடிவு, AI விசை இல்லை",
    langLabel: "உதவியாளர் மொழி",
    permDenied: "மைக்ரோஃபோன் அணுகல் மறுக்கப்பட்டது. உலாவி அமைப்புகளில் மைக்ரோஃபோன் அனுமதியை வழங்கவும்.",
    noSupport: "இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை. Chrome அல்லது Edge பயன்படுத்தவும்.",
    recogError: "பேச்சு அடையாளம் காண முடியவில்லை. மீண்டும் முயற்சிக்கவும் அல்லது தட்டச்சு செய்யவும்.",
    editHint: "அனுப்புவதற்கு முன் சரிபார்க்கவும்",
  },
  hi: {
    eyebrow: "सटीक सहायक · आवाज़ सक्षम",
    heading: "सहायक से पूछें",
    intro: "आसान शब्दों में पूछें, जैसे \"मैं किसान हूं, मुझे क्या मिल सकता है?\" जवाब केवल योजना डेटाबेस पर आधारित होते हैं। 4 भाषाओं में बोलें या टाइप करें।",
    placeholder: "किसी भी योजना के बारे में पूछें…",
    send: "भेजें",
    listening: "सुन रहा है…",
    micTitle: "आवाज़ इनपुट शुरू करें",
    stopTitle: "रिकॉर्डिंग बंद करें",
    speakTitle: "उत्तर ज़ोर से पढ़ें",
    tryThese: "इनमें से एक आज़माएं",
    q1: "मैं रेहड़ी-पटरी विक्रेता हूं, मुझे कौन सा ऋण मिल सकता है?",
    q2: "इंजीनियरिंग करने वाली छात्राओं के लिए छात्रवृत्ति",
    q3: "किसानों के लिए पेंशन योजनाएं",
    searching: "योजनाएं खोजी जा रही हैं…",
    aiLabel: "एआई द्वारा तैयार उत्तर",
    retrievalLabel: "सामान्य खोज, AI कुंजी नहीं है",
    langLabel: "सहायक भाषा",
    permDenied: "माइक्रोफ़ोन एक्सेस अस्वीकार कर दिया गया। कृपया ब्राउज़र सेटिंग्स में माइक्रोफ़ोन अनुमति दें।",
    noSupport: "इस ब्राउज़र में वॉइस इनपुट समर्थित नहीं है। Chrome या Edge का उपयोग करें।",
    recogError: "भाषण पहचाना नहीं जा सका। फिर कोशिश करें या टाइप करें।",
    editHint: "भेजने से पहले समीक्षा करें",
  },
  te: {
    eyebrow: "సహాయకుడు · వాయిస్ ఆధారితం",
    heading: "సహాయకుడిని అడగండి",
    intro: "\"నేను రైతును, నాకు ఏమి లభిస్తుంది?\" వంటి సాధారణ మాటల్లో అడగండి. సమాధానాలు అధికారిక పథకాల డేటాబేస్ ఆధారంగా మాత్రమే.",
    placeholder: "ఏదైనా పథకం గురించి అడగండి…",
    send: "పంపండి",
    listening: "వింటోంది…",
    micTitle: "వాయిస్ ఇన్‌పుట్ ప్రారంభించండి",
    stopTitle: "రికార్డింగ్ ఆపండి",
    speakTitle: "సమాధానం చదివి వినిపించండి",
    tryThese: "వీటిలో ఒకదాన్ని ప్రయత్నించండి",
    q1: "నేను వీధి వ్యాపారిని, నాకు ఏ రుణాలు లభిస్తాయి?",
    q2: "ఇంజనీరింగ్ చదివే బాలికల కోసం స్కాలర్‌షిప్‌లు",
    q3: "రైతుల కోసం పెన్షన్ పథకాలు",
    searching: "పథకాలను శోధిస్తోంది…",
    aiLabel: "AI రూపొందించిన సమాధానం",
    retrievalLabel: "సాధారణ శోధన, AI కీ లేదు",
    langLabel: "సహాయకుడి భాష",
    permDenied: "మైక్రోఫోన్ యాక్సెస్ నిరాకరించబడింది. బ్రౌజర్ సెట్టింగ్‌లలో మైక్రోఫోన్ అనుమతి ఇవ్వండి.",
    noSupport: "ఈ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్ అందుబాటులో లేదు. Chrome లేదా Edge ఉపయోగించండి.",
    recogError: "మాటలు గుర్తించలేకపోయాం. మళ్లీ ప్రయత్నించండి లేదా టైప్ చేయండి.",
    editHint: "పంపే ముందు సరిచూడండి",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

// ─── Mic button ───────────────────────────────────────────────────────────────
function MicButton({
  listening, onStart, onStop, disabled, uiLang,
}: {
  listening: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled: boolean;
  uiLang: AssistantLang;
}) {
  const ui = UI[uiLang];
  return (
    <button
      type="button"
      onClick={listening ? onStop : onStart}
      disabled={disabled}
      title={listening ? ui.stopTitle : ui.micTitle}
      aria-label={listening ? ui.stopTitle : ui.micTitle}
      className={`flex h-10 w-10 flex-none items-center justify-center rounded-full border transition focus:outline-none focus:ring-2 focus:ring-banyan/30 ${listening
          ? "animate-pulse border-alert bg-alert/10 text-alert"
          : "border-line bg-white text-inkmuted hover:border-banyan hover:text-banyan"
        } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {listening ? (
        // Stop icon
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="3" y="3" width="10" height="10" rx="2" />
        </svg>
      ) : (
        // Mic icon
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="5" y="1" width="6" height="9" rx="3" />
          <path d="M2 8c0 3.3 2.7 6 6 6s6-2.7 6-6" strokeLinecap="round" />
          <line x1="8" y1="14" x2="8" y2="15.5" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

// ─── Speaker button ───────────────────────────────────────────────────────────
function SpeakButton({ text, bcp47, uiLang }: { text: string; bcp47: string; uiLang: AssistantLang }) {
  const [speaking, setSpeaking] = useState(false);

  const speak = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (speaking) { setSpeaking(false); return; }
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = bcp47;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  // Cancel if component unmounts
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  return (
    <button
      type="button"
      onClick={speak}
      title={UI[uiLang].speakTitle}
      aria-label={UI[uiLang].speakTitle}
      className={`mt-1 flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide transition ${speaking
          ? "border-banyan bg-banyan text-white"
          : "border-line bg-white text-inkmuted hover:border-banyan hover:text-banyan"
        }`}
    >
      {speaking ? (
        <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="4" width="4" height="8" rx="1" /><path d="M7 2l6 6-6 6V2z" /></svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 5h3l4-3v12l-4-3H2z" /><path d="M12 5c1.5 1 2.5 2 2.5 3s-1 2-2.5 3" strokeLinecap="round" /></svg>
      )}
      {UI[uiLang].speakTitle}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AssistantPage() {
  const { lang: globalLang } = useLang();

  // Independent assistant language — does NOT affect rest of site
  const [aLang, setALang] = useState<AssistantLang>(() => {
    if (typeof window === "undefined") return "en";
    const stored = localStorage.getItem("assistant_lang") as AssistantLang | null;
    return stored && ["en", "ta", "hi", "te"].includes(stored) ? stored : "en";
  });

  const ui = UI[aLang];
  const currentLangConfig = ASSISTANT_LANGS.find((l) => l.code === aLang)!;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Persist assistant language independently of global lang
  const changeALang = (code: AssistantLang) => {
    setALang(code);
    localStorage.setItem("assistant_lang", code);
    stopListening();
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const send = useCallback(async () => {
    const content = input.trim();
    if (!content || loading) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const out = await api<{ reply: string; used_llm: boolean; schemes: Scheme[] }>("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: next.map(({ role, content: c }) => ({ role, content: c })),
          lang: aLang,          // answer in assistant language
        }),
      });
      setMessages((m) => [
        ...m,
        { role: "assistant", content: out.reply, schemes: out.schemes, usedLlm: out.used_llm },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: e instanceof Error ? e.message : "Something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, aLang]);

  // ── Voice: stop ───────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  // ── Voice: start ──────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    setVoiceError("");
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      setVoiceError(ui.noSupport);
      return;
    }

    // Request mic permission proactively
    navigator.mediaDevices?.getUserMedia({ audio: true }).catch(() => {
      setVoiceError(ui.permDenied);
    });

    const rec = new SpeechRecognition();
    // Use selected assistant language locale for recognition
    rec.lang = currentLangConfig.bcp47;
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);

    rec.onresult = (event) => {
      let transcript = "";
      const e = event as SpeechRecognitionEvent;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setInput(transcript);
    };

    rec.onerror = (event) => {
      const e = event as SpeechRecognitionErrorEvent;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setVoiceError(ui.permDenied);
      } else if (e.error === "no-speech") {
        setVoiceError(ui.recogError);
      } else {
        setVoiceError(ui.recogError);
      }
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      setVoiceError(ui.recogError);
      setListening(false);
    }
  }, [currentLangConfig.bcp47, ui]);

  // Cleanup on unmount
  useEffect(() => () => stopListening(), [stopListening]);

  const hasVoiceSupport = typeof window !== "undefined" && !!getSpeechRecognition();

  const tryQuestions = [ui.q1, ui.q2, ui.q3];

  return (
    <div className="container-page flex max-w-3xl flex-col py-10">
      {/* Header */}
      <p className="eyebrow">{ui.eyebrow}</p>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">{ui.heading}</h1>

        {/* Assistant language selector — independent of site language */}
        <div className="flex flex-col items-end gap-1">
          <label className="font-mono text-[10px] uppercase tracking-widest text-inkmuted">
            {ui.langLabel}
          </label>
          <div className="flex gap-1">
            {ASSISTANT_LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => changeALang(l.code)}
                className={`rounded-full border px-2.5 py-1 font-mono text-xs font-semibold transition ${aLang === l.code
                    ? "border-banyan bg-banyan text-white shadow-sm"
                    : "border-line bg-white text-ink hover:border-banyan/50"
                  }`}
                title={l.label}
              >
                {l.native}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-1 text-inkmuted">{ui.intro}</p>

      {/* Chat window */}
      <div className="card mt-6 flex min-h-[52vh] flex-col gap-4 bg-khadiraised/40">
        {messages.length === 0 && (
          <div className="m-auto max-w-sm text-center text-inkmuted">
            <div className="mb-4 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-banyan/10 text-3xl">
                🤖
              </span>
            </div>
            <p className="font-medium text-ink">{ui.tryThese}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {tryQuestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="rounded-full border border-line bg-white px-3 py-1.5 text-sm transition hover:border-banyan hover:text-banyan"
                >
                  {s}
                </button>
              ))}
            </div>
            {hasVoiceSupport && (
              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-inkmuted">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="5" y="1" width="6" height="9" rx="3" />
                  <path d="M2 8c0 3.3 2.7 6 6 6s6-2.7 6-6" strokeLinecap="round" />
                </svg>
                {ui.micTitle}
              </p>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${m.role === "user"
                  ? "rounded-br-sm bg-ink text-khadi"
                  : "rounded-bl-sm border border-line bg-white text-ink"
                }`}
            >
              {m.content}
            </div>

            {/* AI badge + TTS button */}
            {m.role === "assistant" && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {m.usedLlm !== undefined && (
                  <span
                    className={`font-mono text-[10px] uppercase tracking-wide ${m.usedLlm ? "text-banyan" : "text-inkmuted"
                      }`}
                  >
                    {m.usedLlm ? ui.aiLabel : ui.retrievalLabel}
                  </span>
                )}
                {typeof window !== "undefined" && window.speechSynthesis && (
                  <SpeakButton
                    text={m.content}
                    bcp47={currentLangConfig.bcp47}
                    uiLang={aLang}
                  />
                )}
              </div>
            )}

            {/* Scheme links */}
            {m.schemes && m.schemes.length > 0 && (
              <div className="mt-2 flex max-w-[85%] flex-wrap gap-2">
                {m.schemes.map((s) => (
                  <Link
                    key={s.id}
                    href={`/schemes/${s.slug}`}
                    className="tag transition hover:bg-banyan hover:text-white"
                  >
                    {s.name} →
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-inkmuted">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-banyan [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-banyan [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-banyan" />
            </span>
            {ui.searching}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Listening indicator */}
      {listening && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-alert/30 bg-alert/5 px-3 py-2 text-sm text-alert animate-pulse">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="5" y="1" width="6" height="9" rx="3" />
            <path d="M2 8c0 3.3 2.7 6 6 6s6-2.7 6-6" strokeLinecap="round" />
          </svg>
          {ui.listening}
        </div>
      )}

      {/* Voice error banner */}
      {voiceError && (
        <p className="mt-2 rounded-lg border border-alert/20 bg-alertlight px-3 py-2 text-sm text-alert">
          {voiceError}
          <button
            className="ml-2 text-xs underline opacity-70 hover:opacity-100"
            onClick={() => setVoiceError("")}
          >
            ✕
          </button>
        </p>
      )}

      {/* Transcript preview hint */}
      {listening && input && (
        <p className="mt-1 text-xs text-inkmuted">{ui.editHint}</p>
      )}

      {/* Input row */}
      <div className="mt-3 flex gap-2">
        {/* Mic button */}
        {hasVoiceSupport && (
          <MicButton
            listening={listening}
            onStart={startListening}
            onStop={stopListening}
            disabled={loading}
            uiLang={aLang}
          />
        )}

        {/* Text input */}
        <input
          className="field flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={listening ? ui.listening : ui.placeholder}
          aria-label="Message input"
          lang={currentLangConfig.bcp47}
        />

        {/* Send button */}
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="btn-primary"
        >
          {ui.send}
        </button>
      </div>

      {/* No voice support notice */}
      {!hasVoiceSupport && (
        <p className="mt-2 text-xs text-inkmuted">{ui.noSupport}</p>
      )}
    </div>
  );
}
