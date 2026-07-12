"use client";
import { useState } from "react";
import Link from "next/link";
import { api, SmartCheckOut, MatchResult } from "@/lib/api";
import { useLang, OPTION_LABELS } from "@/lib/i18n";

const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Other UT"];

function Result({ r, verdictLabel, sealClass }: { r: MatchResult; verdictLabel: string; sealClass: string }) {
  const { t } = useLang();
  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link href={`/schemes/${r.scheme.slug}`} className="font-display text-lg font-semibold hover:text-banyan">
            {r.scheme.name}
          </Link>
          <p className="mt-0.5 font-mono text-sm font-semibold text-saffrondeep">{r.scheme.benefits}</p>
        </div>
        <span className={sealClass}>{verdictLabel}</span>
      </div>
      {r.criteria.length > 0 && (
        <div className="mt-3 border-t border-dashed border-line pt-3">
          <p className="text-xs font-bold uppercase tracking-wider text-inkmuted">{t("whyMatch")}</p>
          <ul className="mt-1.5 space-y-1 text-sm">
            {r.criteria.map((c, i) => (
              <li key={i} className={`flex gap-1.5 ${c.status === "met" ? "text-banyan" : c.status === "not_met" ? "text-alert" : "text-inkmuted"}`}>
                <span aria-hidden>{c.status === "met" ? "✓" : c.status === "not_met" ? "✗" : "?"}</span>
                <span>{c.label}{c.status === "unknown" && t("notProvided")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {r.scheme.apply_url && (
        <a href={r.scheme.apply_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-banyan underline decoration-line underline-offset-2 hover:decoration-banyan">
          {t("apply")} ↗
        </a>
      )}
    </div>
  );
}

export default function CheckPage() {
  const { t, lang } = useLang();
  const [form, setForm] = useState({
    age: "", gender: "", state: "", category: "", annual_income: "",
    occupation: "", area: "", disability: "", minority: "",
  });
  const [results, setResults] = useState<SmartCheckOut | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setLoading(true); setError(""); setResults(null);
    try {
      const body: Record<string, unknown> = { lang };
      if (form.age) body.age = Number(form.age);
      if (form.annual_income) body.annual_income = Number(form.annual_income);
      for (const k of ["gender", "state", "category", "occupation", "area"]) {
        if (form[k as keyof typeof form]) body[k] = form[k as keyof typeof form];
      }
      if (form.disability) body.disability = form.disability === "yes";
      if (form.minority) body.minority = form.minority === "yes";
      const out = await api<SmartCheckOut>("/api/eligibility/smart-check", { method: "POST", body: JSON.stringify(body) });
      setResults(out);
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const opt = (group: keyof typeof OPTION_LABELS, key: string) =>
    (OPTION_LABELS[group] as Record<string, { en: string; hi: string }>)[key]?.[lang] ?? key;

  return (
    <div className="container-page py-10">
      <p className="eyebrow">Rule-based, explainable</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">{t("checkNow")}</h1>
      <p className="mt-1 text-inkmuted">Every field is optional. The more you fill, the sharper your results.</p>

      <div className="card mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label" htmlFor="age">Age</label>
          <input id="age" type="number" min={0} max={120} className="field" value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="e.g. 21" />
        </div>
        <div>
          <label className="label" htmlFor="gender">Gender</label>
          <select id="gender" className="field" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="">Select</option>
            <option value="female">{opt("gender", "female")}</option>
            <option value="male">{opt("gender", "male")}</option>
            <option value="other">{opt("gender", "other")}</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="state">State</label>
          <select id="state" className="field" value={form.state} onChange={(e) => set("state", e.target.value)}>
            <option value="">Select</option>{STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="category">Category</label>
          <select id="category" className="field" value={form.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">Select</option>
            {(["general", "obc", "sc", "st", "ews"] as const).map((k) => <option key={k} value={k}>{opt("category", k)}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="income">Annual household income (₹)</label>
          <input id="income" type="number" min={0} className="field" value={form.annual_income} onChange={(e) => set("annual_income", e.target.value)} placeholder="e.g. 300000" />
        </div>
        <div>
          <label className="label" htmlFor="occupation">Occupation</label>
          <select id="occupation" className="field" value={form.occupation} onChange={(e) => set("occupation", e.target.value)}>
            <option value="">Select</option>
            {(["student", "farmer", "self-employed", "salaried", "unemployed", "artisan", "street-vendor", "other"] as const).map((k) => (
              <option key={k} value={k}>{opt("occupation", k)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="area">Area</label>
          <select id="area" className="field" value={form.area} onChange={(e) => set("area", e.target.value)}>
            <option value="">Select</option>
            <option value="rural">{opt("area", "rural")}</option>
            <option value="urban">{opt("area", "urban")}</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="disability">Person with disability?</label>
          <select id="disability" className="field" value={form.disability} onChange={(e) => set("disability", e.target.value)}>
            <option value="">Select</option>
            <option value="yes">{opt("yesno", "yes")}</option>
            <option value="no">{opt("yesno", "no")}</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="minority">Notified minority community?</label>
          <select id="minority" className="field" value={form.minority} onChange={(e) => set("minority", e.target.value)}>
            <option value="">Select</option>
            <option value="yes">{opt("yesno", "yes")}</option>
            <option value="no">{opt("yesno", "no")}</option>
          </select>
        </div>
        <div className="flex items-end sm:col-span-2 lg:col-span-3">
          <button onClick={submit} disabled={loading} className="btn-accent w-full sm:w-auto">
            {loading ? "Checking 23 schemes..." : t("checkNow")}
          </button>
        </div>
      </div>

      {error && <p className="mt-4 bg-alertlight p-3 text-sm text-alert border border-alert/20 rounded-lg">{error}</p>}

      {results && (
        <div id="results" className="mt-10 space-y-8">
          <div className="card border-2 border-banyan/15 bg-banyanlight/40">
            <div className="flex items-center justify-between gap-2">
              <p className="eyebrow">{t("yourReport")}</p>
              <span className={`font-mono text-[10px] uppercase tracking-wide ${results.used_llm ? "text-banyan" : "text-inkmuted"}`}>
                {results.used_llm ? t("aiWrote") : t("templateWrote")}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-ink">{results.narrative}</p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-banyan">✓ {t("eligible")} ({results.eligible.length})</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {results.eligible.map((r) => <Result key={r.scheme.id} r={r} verdictLabel={"✓ " + t("eligible")} sealClass="seal-eligible" />)}
              {results.eligible.length === 0 && <p className="text-inkmuted">No confirmed matches. Check the likely list below and add more details above.</p>}
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-saffrondeep">? {t("likely")} ({results.likely.length})</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {results.likely.map((r) => <Result key={r.scheme.id} r={r} verdictLabel={"? " + t("likely")} sealClass="seal-likely" />)}
            </div>
          </div>
          <p className="text-sm text-inkmuted">{results.not_eligible_count} schemes did not match your profile. {t("disclaimer")}</p>
        </div>
      )}
    </div>
  );
}
