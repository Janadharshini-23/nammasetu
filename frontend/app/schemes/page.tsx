"use client";
import { useEffect, useState } from "react";
import { api, Scheme, withLang } from "@/lib/api";
import SchemeCard from "@/components/SchemeCard";
import { useLang, TAG_LABELS } from "@/lib/i18n";

export default function SchemesPage() {
  const { t, lang } = useLang();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<string[]>("/api/schemes/tags").then(setTags).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (tag) params.set("tag", tag);
      api<Scheme[]>(withLang(`/api/schemes?${params}`, lang))
        .then((s) => {
          setSchemes(s);
          setError("");
        })
        .catch((e) => setError(e instanceof Error ? e.message : t("serverError")))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [q, tag, lang, t]);

  return (
    <div className="container-page py-10">
      <p className="eyebrow">{t("schemesEyebrow")}</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">{t("browseAllHeading")}</h1>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className="field sm:max-w-sm"
          placeholder={t("searchPlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={t("searchPlaceholder")}
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setTag("")}
            className={`rounded-full px-3 py-1 font-mono text-xs font-semibold transition ${
              tag === "" ? "bg-banyan text-white shadow-sm" : "border border-line bg-white hover:border-banyan"
            }`}
          >
            {t("allTag")}
          </button>
          {tags.map((tg) => (
            <button
              key={tg}
              onClick={() => setTag(tg === tag ? "" : tg)}
              className={`rounded-full px-3 py-1 font-mono text-xs font-semibold transition ${
                tag === tg ? "bg-banyan text-white shadow-sm" : "border border-line bg-white hover:border-banyan"
              }`}
            >
              {TAG_LABELS[tg]?.[lang] ?? tg}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="mt-6 bg-alertlight p-3 text-sm text-alert border border-alert/20 rounded-lg">{error}</p>}
      {loading ? (
        <p className="mt-8 text-inkmuted">{t("loadingSchemes")}</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {schemes.map((s) => (
            <SchemeCard key={s.id} scheme={s} />
          ))}
          {schemes.length === 0 && !error && <p className="text-inkmuted">{t("noSearchMatch")}</p>}
        </div>
      )}
    </div>
  );
}
