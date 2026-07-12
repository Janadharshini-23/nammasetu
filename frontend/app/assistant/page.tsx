"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { api, Scheme } from "@/lib/api";
import { useLang } from "@/lib/i18n";

type Msg = { role: "user" | "assistant"; content: string; schemes?: Scheme[]; usedLlm?: boolean };

export default function AssistantPage() {
  const { t, lang } = useLang();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const content = input.trim();
    if (!content || loading) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const out = await api<{ reply: string; used_llm: boolean; schemes: Scheme[] }>("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })), lang }),
      });
      setMessages((m) => [...m, { role: "assistant", content: out.reply, schemes: out.schemes, usedLlm: out.used_llm }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: e instanceof Error ? e.message : "Something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page flex max-w-3xl flex-col py-10">
      <p className="eyebrow">Grounded assistant</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">{t("askAI")}</h1>
      <p className="mt-1 text-inkmuted">{t("assistantIntro")}</p>

      <div className="card mt-6 flex min-h-[55vh] flex-col gap-4 bg-khadiraised/40">
        {messages.length === 0 && (
          <div className="m-auto max-w-sm text-center text-inkmuted">
            <p className="font-medium text-ink">{t("tryOneOfThese")}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {(lang === "hi"
                ? ["मैं रेहड़ी-पटरी विक्रेता हूं, मुझे कौन सा ऋण मिल सकता है?", "इंजीनियरिंग करने वाली छात्राओं के लिए छात्रवृत्ति", "किसानों के लिए पेंशन योजनाएं"]
                : ["I'm a street vendor, what loans can I get?", "Scholarships for girl students in engineering", "Pension schemes for farmers"]
              ).map((s) => (
                <button key={s} onClick={() => setInput(s)} className="rounded-full border border-line bg-white px-3 py-1.5 text-sm transition hover:border-banyan hover:text-banyan">{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                m.role === "user" ? "rounded-br-sm bg-ink text-khadi" : "rounded-bl-sm border border-line bg-white text-ink"
              }`}
            >
              {m.content}
            </div>
            {m.role === "assistant" && m.usedLlm !== undefined && (
              <span className={`mt-1 font-mono text-[10px] uppercase tracking-wide ${m.usedLlm ? "text-banyan" : "text-inkmuted"}`}>
                {m.usedLlm ? t("aiAnswer") : t("retrievalOnly")}
              </span>
            )}
            {m.schemes && m.schemes.length > 0 && (
              <div className="mt-2 flex max-w-[85%] flex-wrap gap-2">
                {m.schemes.map((s) => (
                  <Link key={s.id} href={`/schemes/${s.slug}`} className="tag transition hover:bg-banyan hover:text-white">{s.name} →</Link>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-inkmuted">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-banyan [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-banyan [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-banyan" />
            </span>
            {t("searchingSchemes")}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-4 flex gap-2">
        <input
          className="field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={t("askPlaceholder")}
          aria-label="Message"
        />
        <button onClick={send} disabled={loading || !input.trim()} className="btn-primary">{t("send")}</button>
      </div>
    </div>
  );
}
