"use client";
import { useEffect, useState } from "react";
import { api, Scheme, withLang } from "@/lib/api";
import { useLang, TAG_LABELS } from "@/lib/i18n";
import Link from "next/link";

const MAX = 3;

export default function ComparePage() {
  const { t, lang } = useLang();
  const [allSchemes, setAllSchemes] = useState<Scheme[]>([]);
  const [selected, setSelected] = useState<(string | "")[]>(["", "", ""]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api<Scheme[]>(withLang("/api/schemes", lang))
      .then((s) => { setAllSchemes(s); setLoading(false); })
      .catch((e) => { setError(e instanceof Error ? e.message : t("serverError")); setLoading(false); });
  }, [lang]);

  const setSlot = (idx: number, slug: string) =>
    setSelected((prev) => prev.map((v, i) => (i === idx ? slug : v)));

  const selectedSchemes = selected
    .map((slug) => (slug ? allSchemes.find((s) => s.slug === slug) : undefined))
    .filter(Boolean) as Scheme[];

  const placeholders = [t("selectScheme1"), t("selectScheme2"), t("selectScheme3")];

  const rows: { label: string; render: (s: Scheme) => React.ReactNode }[] = [
    {
      label: t("comparisonTableMinistry"),
      render: (s) => (
        <span className="text-sm text-inkmuted">
          {s.ministry ?? "—"} · {s.level}
        </span>
      ),
    },
    {
      label: t("comparisonTableBenefits"),
      render: (s) => (
        <span className="font-mono text-sm font-semibold text-saffrondeep">
          {s.benefits ?? "—"}
        </span>
      ),
    },
    {
      label: t("comparisonTableEligibility"),
      render: (s) => (
        <span className="text-sm text-inkmuted leading-relaxed">
          {s.eligibility_text ?? "—"}
        </span>
      ),
    },
    {
      label: t("comparisonTableDocs"),
      render: (s) =>
        s.documents && s.documents.length > 0 ? (
          <ul className="list-disc list-inside space-y-0.5 text-sm text-inkmuted">
            {s.documents.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        ) : (
          <span className="text-sm text-inkmuted">—</span>
        ),
    },
    {
      label: t("comparisonTableApply"),
      render: (s) =>
        s.apply_url ? (
          <a
            href={s.apply_url}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm font-semibold text-banyan underline decoration-line underline-offset-2 hover:decoration-banyan"
          >
            {t("apply")} ↗
          </a>
        ) : (
          <span className="text-sm text-inkmuted">—</span>
        ),
    },
  ];

  return (
    <div className="container-page py-10">
      <p className="eyebrow">{t("compareEyebrow")}</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">{t("compareHeading")}</h1>
      <p className="mt-2 max-w-2xl text-inkmuted">{t("compareSub")}</p>

      {error && (
        <p className="mt-6 rounded-lg border border-alert/20 bg-alertlight p-3 text-sm text-alert">
          {error}
        </p>
      )}

      {/* Slot selectors */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {Array.from({ length: MAX }, (_, i) => (
          <div key={i}>
            <label className="label mb-1 block">{placeholders[i]}</label>
            <select
              className="field"
              value={selected[i]}
              onChange={(e) => setSlot(i, e.target.value)}
              disabled={loading}
            >
              <option value="">{placeholders[i]}</option>
              {allSchemes
                .filter((s) => !selected.some((sl, si) => si !== i && sl === s.slug))
                .map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      {selectedSchemes.length >= 2 ? (
        <div className="mt-8 overflow-x-auto rounded-xl border border-line shadow-sm">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-line bg-khadiraised/40">
                <th className="px-4 py-3 font-display text-sm font-semibold text-inkmuted w-32 shrink-0">
                  &nbsp;
                </th>
                {selectedSchemes.map((s) => (
                  <th key={s.slug} className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {s.tags.slice(0, 2).map((tg) => (
                        <span key={tg} className="tag text-[10px]">
                          {TAG_LABELS[tg]?.[lang] ?? tg}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={`/schemes/${s.slug}`}
                      className="font-display text-base font-semibold hover:text-banyan leading-snug"
                    >
                      {s.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr
                  key={ri}
                  className={`border-b border-line ${ri % 2 === 0 ? "bg-white" : "bg-khadiraised/20"}`}
                >
                  <td className="px-4 py-4 font-mono text-xs font-semibold uppercase tracking-wide text-inkmuted align-top">
                    {row.label}
                  </td>
                  {selectedSchemes.map((s) => (
                    <td key={s.slug} className="px-4 py-4 align-top max-w-xs">
                      {row.render(s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card mt-8 py-12 text-center text-inkmuted">
          <p className="text-4xl mb-4">⚖️</p>
          <p className="font-medium">{t("compareNoSchemesSelected")}</p>
        </div>
      )}
    </div>
  );
}
