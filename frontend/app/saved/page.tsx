"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Scheme, getToken, withLang } from "@/lib/api";
import SchemeCard from "@/components/SchemeCard";
import { useLang } from "@/lib/i18n";

export default function SavedPage() {
  const { t, lang } = useLang();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "anon" | "error">("loading");

  useEffect(() => {
    if (!getToken()) { setState("anon"); return; }
    api<Scheme[]>(withLang("/api/schemes/saved", lang))
      .then((s) => { setSchemes(s); setState("ready"); })
      .catch(() => setState("error"));
  }, [lang]);

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold">{t("navSaved")}</h1>
      {state === "anon" && (
        <p className="mt-4 text-inkmuted">
          <Link href="/login" className="text-banyan underline">{t("login")}</Link> {t("loginToSave")}
        </p>
      )}
      {state === "error" && <p className="mt-4 rounded-lg border border-alert/20 bg-alertlight p-3 text-sm text-alert">{t("sessionExpired")}</p>}
      {state === "ready" && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {schemes.map((s) => <SchemeCard key={s.id} scheme={s} />)}
          {schemes.length === 0 && <p className="text-inkmuted">{t("nothingSaved")}</p>}
        </div>
      )}
    </div>
  );
}
