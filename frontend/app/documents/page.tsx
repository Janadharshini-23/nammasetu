"use client";
import { useEffect, useState } from "react";
import { api, DocumentTrackerOut, TrackedDocument, withLang } from "@/lib/api";
import { useLang } from "@/lib/i18n";

type DocStatus = "have" | "need" | null;

export default function DocumentsPage() {
  const { t, lang } = useLang();
  const [data, setData] = useState<DocumentTrackerOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statuses, setStatuses] = useState<Record<string, DocStatus>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    api<DocumentTrackerOut>(withLang("/api/documents/tracker", lang))
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e instanceof Error ? e.message : t("documentFetchError")); setLoading(false); });
  };

  useEffect(() => { load(); }, [lang]);

  const setStatus = (id: string, s: DocStatus) =>
    setStatuses((prev) => ({ ...prev, [id]: prev[id] === s ? null : s }));

  const haveCount = Object.values(statuses).filter((v) => v === "have").length;
  const totalDocs = data?.documents.length ?? 0;

  const allCategories = data
    ? Array.from(new Set(data.documents.map((d) => d.category)))
    : [];

  const filtered = data
    ? data.documents.filter((d) => !categoryFilter || d.category === categoryFilter)
    : [];

  return (
    <div className="container-page py-10">
      <p className="eyebrow">{t("docTrackerEyebrow")}</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">{t("docTrackerHeading")}</h1>
      <p className="mt-2 max-w-2xl text-inkmuted">{t("docTrackerSub")}</p>

      {/* Readiness Summary */}
      {totalDocs > 0 && (
        <div className="card mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-2 border-banyan/20 bg-banyanlight/30">
          <div>
            <p className="font-display text-lg font-semibold">{t("readinessSummary")}</p>
            <p className="mt-0.5 text-sm text-inkmuted">
              <span className="font-bold text-banyan">{haveCount}</span>{" "}
              {t("docsReadyOutOf")} {totalDocs} {t("documentsReadyPercent")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-3 w-32 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-banyan transition-all duration-500"
                style={{ width: `${totalDocs > 0 ? Math.round((haveCount / totalDocs) * 100) : 0}%` }}
              />
            </div>
            <span className="font-mono text-sm font-semibold text-banyan">
              {totalDocs > 0 ? Math.round((haveCount / totalDocs) * 100) : 0}%
            </span>
          </div>
        </div>
      )}

      {/* Category filter */}
      {allCategories.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter("")}
            className={`rounded-full px-3 py-1 font-mono text-xs font-semibold transition ${
              categoryFilter === "" ? "bg-banyan text-white shadow-sm" : "border border-line bg-white hover:border-banyan"
            }`}
          >
            {t("allCategories")}
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat === categoryFilter ? "" : cat)}
              className={`rounded-full px-3 py-1 font-mono text-xs font-semibold transition ${
                categoryFilter === cat ? "bg-banyan text-white shadow-sm" : "border border-line bg-white hover:border-banyan"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* States */}
      {loading && (
        <p className="mt-8 text-inkmuted animate-pulse">{t("loadingDocuments")}</p>
      )}

      {error && (
        <div className="mt-6 rounded-lg border border-alert/20 bg-alertlight p-4">
          <p className="text-sm text-alert">{error}</p>
          <button onClick={load} className="btn-ghost mt-3 text-sm">
            {t("retryButton")}
          </button>
        </div>
      )}

      {/* Document cards */}
      {!loading && !error && data && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {filtered.map((doc: TrackedDocument) => {
            const status = statuses[doc.id] ?? null;
            const isExpanded = expanded === doc.id;
            return (
              <div
                key={doc.id}
                className={`card transition-all duration-200 ${
                  status === "have"
                    ? "border-banyan/40 bg-banyanlight/30"
                    : status === "need"
                    ? "border-saffron/40 bg-saffron/5"
                    : ""
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-inkmuted">
                      {doc.category}
                    </p>
                    <p className="mt-0.5 font-display font-semibold text-ink">{doc.name}</p>
                    {doc.schemes_count > 0 && (
                      <p className="mt-0.5 text-xs text-inkmuted">
                        {t("requiredBySchemes")}: {doc.schemes_count}
                      </p>
                    )}
                  </div>
                  {status === "have" && (
                    <span className="seal-eligible flex-none text-xs">✓</span>
                  )}
                  {status === "need" && (
                    <span className="rounded-full bg-saffron/20 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-saffrondeep flex-none">
                      {t("docStatusNeed")}
                    </span>
                  )}
                </div>

                {/* Toggle buttons */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setStatus(doc.id, "have")}
                    className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition ${
                      status === "have"
                        ? "border-banyan bg-banyan text-white"
                        : "border-line bg-white text-ink hover:border-banyan/50"
                    }`}
                  >
                    ✓ {t("docStatusHave")}
                  </button>
                  <button
                    onClick={() => setStatus(doc.id, "need")}
                    className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition ${
                      status === "need"
                        ? "border-saffrondeep bg-saffron/20 text-saffrondeep"
                        : "border-line bg-white text-ink hover:border-saffron/50"
                    }`}
                  >
                    {t("docStatusNeed")}
                  </button>
                </div>

                {/* Description */}
                <p className="mt-3 text-sm text-inkmuted leading-relaxed">{doc.description}</p>

                {/* Expand / collapse how-to */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : doc.id)}
                  className="mt-2 text-xs font-semibold text-banyan hover:underline"
                >
                  {isExpanded ? "▲ " : "▼ "}{t("howToGet")}
                </button>

                {isExpanded && (
                  <div className="mt-2 rounded-lg bg-khadiraised/50 p-3 text-sm text-ink leading-relaxed animate-in fade-in duration-150">
                    <p>{doc.how_to}</p>
                    {doc.portal_url && (
                      <a
                        href={doc.portal_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-banyan underline decoration-line underline-offset-2 hover:decoration-banyan"
                      >
                        {t("officialPortal")} ↗
                      </a>
                    )}
                    {doc.schemes.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-inkmuted mb-1.5">
                          {t("requiredBySchemes")}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {doc.schemes.map((s) => (
                            <a
                              key={s.id}
                              href={`/schemes/${s.slug}`}
                              className="tag transition hover:bg-banyan hover:text-white"
                            >
                              {s.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
