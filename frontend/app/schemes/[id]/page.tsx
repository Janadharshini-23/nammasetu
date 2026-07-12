"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, Scheme, withLang } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLang, TAG_LABELS } from "@/lib/i18n";
import Link from "next/link";

export default function SchemeDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<Scheme>(withLang(`/api/schemes/${id}`, lang)).then(setScheme).catch((e) => setError(e.message));
  }, [id, lang]);

  useEffect(() => {
    if (user) {
      api<Scheme[]>("/api/schemes/saved")
        .then((list) => setSaved(list.some((s) => s.slug === id)))
        .catch(() => {});
    }
  }, [id, user]);

  const toggleSave = async () => {
    try {
      if (saved) { await api(`/api/schemes/${id}/save`, { method: "DELETE" }); setSaved(false); }
      else { await api(`/api/schemes/${id}/save`, { method: "POST" }); setSaved(true); }
    } catch { /* not logged in */ }
  };

  const steps = [
    { title: t("step1Title"), detail: t("step1Detail") },
    { title: t("step2Title"), detail: t("step2Detail") },
    { title: t("step3Title"), detail: t("step3Detail") },
    { title: t("step4Title"), detail: t("step4Detail") },
  ];

  if (error) return <div className="container-page py-10"><p className="rounded-lg border border-alert/20 bg-alertlight p-3 text-alert">{error}</p></div>;
  if (!scheme) return <div className="container-page py-10 text-inkmuted">Loading...</div>;

  return (
    <div className="container-page max-w-3xl py-10">
      <div id="printable">
        <div className="mb-2 flex flex-wrap gap-1.5 print:hidden">
          {scheme.tags.map((tg) => <span key={tg} className="tag">{TAG_LABELS[tg]?.[lang] ?? tg}</span>)}
        </div>
        <h1 className="font-display text-3xl font-semibold leading-tight">{scheme.name}</h1>
        <p className="mt-1 text-sm text-inkmuted">{scheme.ministry} · {scheme.level}</p>

        <p className="mt-5 text-lg">{scheme.summary}</p>

        <div className="card mt-6">
          <h2 className="font-display font-semibold">Benefits</h2>
          <p className="mt-1 font-mono font-semibold text-banyandeep">{scheme.benefits}</p>
          <h2 className="mt-5 font-display font-semibold">Eligibility</h2>
          <p className="mt-1 text-inkmuted">{scheme.eligibility_text}</p>
        </div>

        <div className="card mt-6">
          <h2 className="font-display font-semibold">{t("documents")}</h2>
          <ul className="mt-3 space-y-3">
            {scheme.document_help.map((d) => (
              <li key={d.name} className="rounded-lg border border-line bg-khadiraised/40 p-3">
                <p className="font-semibold text-ink">{d.name}</p>
                <p className="mt-0.5 text-sm text-inkmuted">{d.how_to}</p>
                {d.url && (
                  <a href={d.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-banyan underline print:hidden">
                    {t("howToGetDoc")} ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="card mt-6">
          <h2 className="font-display font-semibold">{t("howToApplySteps")}</h2>
          <ol className="mt-3 space-y-4">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-banyan font-mono text-xs font-bold text-white">{i + 1}</span>
                <div>
                  <p className="font-semibold text-ink">{s.title}</p>
                  <p className="mt-0.5 text-sm text-inkmuted">{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>
          <a href="https://findmycsc.nic.in/csc/" target="_blank" rel="noreferrer"
            className="mt-4 inline-block text-sm font-semibold text-banyan underline decoration-line underline-offset-2 hover:decoration-banyan print:hidden">
            {t("findCsc")} ↗
          </a>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 print:hidden">
        {scheme.apply_url && (
          <a href={scheme.apply_url} target="_blank" rel="noreferrer" className="btn-accent">{t("apply")} ↗</a>
        )}
        {user ? (
          <button onClick={toggleSave} className="btn-ghost">{saved ? "★ " + t("saved") : "☆ " + t("save")}</button>
        ) : (
          <Link href="/login" className="btn-ghost">☆ {t("save")} ({t("login")})</Link>
        )}
        <button onClick={() => window.print()} className="btn-ghost">🖶 {t("printChecklist")}</button>
      </div>
      <p className="mt-6 text-sm text-inkmuted print:hidden">{t("disclaimer")}</p>
    </div>
  );
}
