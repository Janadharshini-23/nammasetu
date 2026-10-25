"use client";
import { useState } from "react";
import Link from "next/link";
import { api, SmartCheckOut, MatchResult } from "@/lib/api";
import { useLang, OPTION_LABELS, ALL_INDIAN_STATES } from "@/lib/i18n";

function Result({ r, verdictLabel, sealClass }: { r: MatchResult; verdictLabel: string; sealClass: string }) {
  const { t } = useLang();
  return (
    <div className="card transition hover:border-banyan/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link href={`/schemes/${r.scheme.slug}`} className="font-display text-lg font-semibold hover:text-banyan">
            {r.scheme.name}
          </Link>
          <p className="mt-0.5 font-mono text-sm font-semibold text-saffrondeep">{r.scheme.benefits}</p>
        </div>
        <span className={sealClass}>{verdictLabel}</span>
      </div>
      {r.criteria && r.criteria.length > 0 && (
        <div className="mt-3 border-t border-dashed border-line pt-3">
          <p className="text-xs font-bold uppercase tracking-wider text-inkmuted">{t("whyMatch")}</p>
          <ul className="mt-1.5 space-y-1 text-sm">
            {r.criteria.map((c, i) => (
              <li
                key={i}
                className={`flex gap-1.5 ${
                  c.status === "met" ? "text-banyan" : c.status === "not_met" ? "text-alert" : "text-inkmuted"
                }`}
              >
                <span aria-hidden>{c.status === "met" ? "✓" : c.status === "not_met" ? "✗" : "?"}</span>
                <span>
                  {c.label}
                  {c.status === "unknown" && t("notProvided")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {r.scheme.apply_url && (
        <a
          href={r.scheme.apply_url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm font-semibold text-banyan underline decoration-line underline-offset-2 hover:decoration-banyan"
        >
          {t("apply")} ↗
        </a>
      )}
    </div>
  );
}

export default function CheckPage() {
  const { t, lang } = useLang();
  const [form, setForm] = useState({
    age: "",
    gender: "",
    state: "",
    category: "",
    annual_income: "",
    occupation: "",
    area: "",
    disability: "",
    minority: "",
  });
  const [results, setResults] = useState<SmartCheckOut | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const body: Record<string, unknown> = { lang };
      if (form.age) body.age = Number(form.age);
      if (form.annual_income) body.annual_income = Number(form.annual_income);
      for (const k of ["gender", "state", "category", "occupation", "area"]) {
        if (form[k as keyof typeof form]) body[k] = form[k as keyof typeof form];
      }
      if (form.disability) body.disability = form.disability === "yes";
      if (form.minority) body.minority = form.minority === "yes";
      const out = await api<SmartCheckOut>("/api/eligibility/smart-check", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setResults(out);
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("serverError"));
    } finally {
      setLoading(false);
    }
  };

  const getOptionLabel = (group: keyof typeof OPTION_LABELS, key: string) =>
    OPTION_LABELS[group]?.[key]?.[lang] ?? OPTION_LABELS[group]?.[key]?.["en"] ?? key;

  return (
    <div className="container-page py-10">
      <p className="eyebrow">{t("ruleBasedEyebrow")}</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">{t("checkEligibilityHeading")}</h1>
      <p className="mt-1 text-inkmuted">{t("optionalNotice")}</p>

      <div className="card mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Age Field */}
        <div>
          <label className="label" htmlFor="age">
            {t("ageLabel")}
          </label>
          <input
            id="age"
            type="number"
            min={0}
            max={120}
            className="field"
            value={form.age}
            onChange={(e) => set("age", e.target.value)}
            placeholder={t("agePlaceholder")}
          />
        </div>

        {/* Gender Field */}
        <div>
          <label className="label" htmlFor="gender">
            {t("genderLabel")}
          </label>
          <select id="gender" className="field" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="">{t("selectGenderPlaceholder")}</option>
            <option value="female">{getOptionLabel("gender", "female")}</option>
            <option value="male">{getOptionLabel("gender", "male")}</option>
            <option value="other">{getOptionLabel("gender", "other")}</option>
          </select>
        </div>

        {/* State / UT Field */}
        <div>
          <label className="label" htmlFor="state">
            {t("stateLabel")}
          </label>
          <select id="state" className="field" value={form.state} onChange={(e) => set("state", e.target.value)}>
            <option value="">{t("selectStatePlaceholder")}</option>
            {ALL_INDIAN_STATES.map((s) => (
              <option key={s.en} value={s.en}>
                {s[lang] || s.en}
              </option>
            ))}
          </select>
        </div>

        {/* Social Category Field */}
        <div>
          <label className="label" htmlFor="category">
            {t("categoryLabel")}
          </label>
          <select
            id="category"
            className="field"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            <option value="">{t("selectCategoryPlaceholder")}</option>
            {(["general", "obc", "sc", "st", "ews"] as const).map((k) => (
              <option key={k} value={k}>
                {getOptionLabel("category", k)}
              </option>
            ))}
          </select>
        </div>

        {/* Annual Income Field */}
        <div>
          <label className="label" htmlFor="income">
            {t("incomeLabel")}
          </label>
          <input
            id="income"
            type="number"
            min={0}
            className="field"
            value={form.annual_income}
            onChange={(e) => set("annual_income", e.target.value)}
            placeholder={t("incomePlaceholder")}
          />
        </div>

        {/* Occupation Field */}
        <div>
          <label className="label" htmlFor="occupation">
            {t("occupationLabel")}
          </label>
          <select
            id="occupation"
            className="field"
            value={form.occupation}
            onChange={(e) => set("occupation", e.target.value)}
          >
            <option value="">{t("selectOccupationPlaceholder")}</option>
            {(
              [
                "student",
                "farmer",
                "self-employed",
                "salaried",
                "unemployed",
                "artisan",
                "street-vendor",
                "other",
              ] as const
            ).map((k) => (
              <option key={k} value={k}>
                {getOptionLabel("occupation", k)}
              </option>
            ))}
          </select>
        </div>

        {/* Residential Area Field */}
        <div>
          <label className="label" htmlFor="area">
            {t("areaLabel")}
          </label>
          <select id="area" className="field" value={form.area} onChange={(e) => set("area", e.target.value)}>
            <option value="">{t("selectAreaPlaceholder")}</option>
            <option value="rural">{getOptionLabel("area", "rural")}</option>
            <option value="urban">{getOptionLabel("area", "urban")}</option>
          </select>
        </div>

        {/* Disability Field */}
        <div>
          <label className="label" htmlFor="disability">
            {t("disabilityLabel")}
          </label>
          <select
            id="disability"
            className="field"
            value={form.disability}
            onChange={(e) => set("disability", e.target.value)}
          >
            <option value="">{t("selectYesNoPlaceholder")}</option>
            <option value="yes">{getOptionLabel("yesno", "yes")}</option>
            <option value="no">{getOptionLabel("yesno", "no")}</option>
          </select>
        </div>

        {/* Minority Community Field */}
        <div>
          <label className="label" htmlFor="minority">
            {t("minorityLabel")}
          </label>
          <select
            id="minority"
            className="field"
            value={form.minority}
            onChange={(e) => set("minority", e.target.value)}
          >
            <option value="">{t("selectYesNoPlaceholder")}</option>
            <option value="yes">{getOptionLabel("yesno", "yes")}</option>
            <option value="no">{getOptionLabel("yesno", "no")}</option>
          </select>
        </div>

        {/* Submit Button */}
        <div className="flex items-end sm:col-span-2 lg:col-span-3">
          <button onClick={submit} disabled={loading} className="btn-accent w-full sm:w-auto">
            {loading ? t("checkingSchemesBtn") : t("checkNowBtn")}
          </button>
        </div>
      </div>

      {error && <p className="mt-4 bg-alertlight p-3 text-sm text-alert border border-alert/20 rounded-lg">{error}</p>}

      {results && (
        <div id="results" className="mt-10 space-y-8 animate-in fade-in duration-200">
          <div className="card border-2 border-banyan/15 bg-banyanlight/40">
            <div className="flex items-center justify-between gap-2">
              <p className="eyebrow">{t("yourReport")}</p>
              <span
                className={`font-mono text-[10px] uppercase tracking-wide ${
                  results.used_llm ? "text-banyan" : "text-inkmuted"
                }`}
              >
                {results.used_llm ? t("aiWrote") : t("templateWrote")}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-ink">{results.narrative}</p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-banyan">
              ✓ {t("eligible")} ({results.eligible.length})
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {results.eligible.map((r) => (
                <Result
                  key={r.scheme.id}
                  r={r}
                  verdictLabel={"✓ " + t("eligible")}
                  sealClass="seal-eligible"
                />
              ))}
              {results.eligible.length === 0 && (
                <p className="text-inkmuted">{t("noConfirmedMatches")}</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-saffrondeep">
              ? {t("likely")} ({results.likely.length})
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {results.likely.map((r) => (
                <Result
                  key={r.scheme.id}
                  r={r}
                  verdictLabel={"? " + t("likely")}
                  sealClass="seal-likely"
                />
              ))}
            </div>
          </div>

          <p className="text-sm text-inkmuted">
            {results.not_eligible_count} {t("schemesDidNotMatch")} {t("disclaimer")}
          </p>
        </div>
      )}
    </div>
  );
}
