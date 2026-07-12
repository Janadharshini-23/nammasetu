"use client";
import Link from "next/link";
import { useLang } from "@/lib/i18n";

const pillars = [
  { en: ["Explainable matches", "Every result shows exactly which rule you met or missed. No black box."], hi: ["पारदर्शी परिणाम", "हर परिणाम बताता है कि कौन सा नियम पूरा हुआ और कौन सा नहीं।"] },
  { en: ["Document checklists", "Know the papers to carry before you visit a CSC or bank."], hi: ["दस्तावेज़ सूची", "आवेदन से पहले ज़रूरी कागज़ात की पूरी सूची पाएँ।"] },
  { en: ["Official links only", "Every Apply button goes straight to the government portal, never a middleman."], hi: ["केवल आधिकारिक लिंक", "हर आवेदन लिंक सीधे सरकारी पोर्टल पर जाता है।"] },
];

const stats = [
  { n: "23", l: "central schemes" },
  { n: "8", l: "question profile" },
  { n: "2", l: "languages" },
];

export default function Home() {
  const { t, lang } = useLang();
  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, #1F2A37 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          aria-hidden
        />
        <div className="container-page relative grid items-center gap-12 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div>
            <p className="eyebrow">{t("tagline")}</p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink md:text-[3.25rem]">
              {t("heroTitle")}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-inkmuted">{t("heroSub")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/check" className="btn-accent">{t("checkNow")} →</Link>
              <Link href="/schemes" className="btn-ghost">{t("browseAll")}</Link>
            </div>
            <dl className="mt-10 flex gap-8 border-t border-line pt-6">
              {stats.map((s) => (
                <div key={s.l}>
                  <dt className="font-display text-3xl font-semibold text-banyan">{s.n}</dt>
                  <dd className="mt-0.5 font-mono text-xs uppercase tracking-wide text-inkmuted">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="animate-stamp mx-auto w-full max-w-sm rotate-1 rounded-2xl border-2 border-ink/10 bg-white p-5 shadow-stamp">
            <div className="flex items-center justify-between border-b border-dashed border-line pb-3">
              <p className="font-mono text-[11px] uppercase tracking-widest text-inkmuted">Eligibility result</p>
              <span className="seal-eligible">✓ {t("eligible")}</span>
            </div>
            <p className="mt-3 font-display text-lg font-semibold">AICTE Pragati Scholarship</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li className="flex gap-2 text-banyan"><span>✓</span><span className="text-ink">Occupation: student</span></li>
              <li className="flex gap-2 text-banyan"><span>✓</span><span className="text-ink">Applicant must be female</span></li>
              <li className="flex gap-2 text-banyan"><span>✓</span><span className="text-ink">Annual household income under ₹8,00,000</span></li>
            </ul>
            <div className="mt-4 rounded-lg bg-saffron/10 px-3 py-2">
              <p className="font-mono text-xs font-semibold text-saffrondeep">₹50,000 / year for the course duration</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-5 sm:grid-cols-3">
          {pillars.map((p, i) => (
            <div key={i} className="card">
              <span className="inline-block h-1.5 w-8 rounded-full bg-saffron" aria-hidden />
              <h3 className="mt-3 font-display text-lg font-semibold">{p[lang][0]}</h3>
              <p className="mt-1.5 text-sm text-inkmuted">{p[lang][1]}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
