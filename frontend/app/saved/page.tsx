"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApplicationTrack, Scheme, getToken, withLang } from "@/lib/api";
import SchemeCard from "@/components/SchemeCard";
import { useLang } from "@/lib/i18n";

export default function SavedPage() {
  const { t, lang } = useLang();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [applications, setApplications] = useState<ApplicationTrack[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "anon" | "error">("loading");
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ scheme_name: "", application_number: "", applied_date: "", tracking_url: "" });
  const [statusDrafts, setStatusDrafts] = useState<Record<number, ApplicationTrack["status"]>>({});

  useEffect(() => {
    if (!getToken()) { setState("anon"); return; }
    Promise.all([
      api<Scheme[]>(withLang("/api/schemes/saved", lang)),
      api<ApplicationTrack[]>("/api/applications"),
    ])
      .then(([s, a]) => { setSchemes(s); setApplications(a); setState("ready"); })
      .catch(() => setState("error"));
  }, [lang]);

  async function createApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    try {
      const application = await api<ApplicationTrack>("/api/applications", {
        method: "POST",
        body: JSON.stringify({ ...form, tracking_url: form.tracking_url || null }),
      });
      setApplications((current) => [application, ...current]);
      setForm({ scheme_name: "", application_number: "", applied_date: "", tracking_url: "" });
      setFormOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("applicationSaveError"));
    }
  }

  async function updateStatus(application: ApplicationTrack) {
    const status = statusDrafts[application.id] || application.status;
    try {
      const updated = await api<ApplicationTrack>(`/api/applications/${application.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setApplications((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch {
      setFormError(t("applicationUpdateError"));
    }
  }

  async function removeApplication(application: ApplicationTrack) {
    try {
      await api<void>(`/api/applications/${application.id}`, { method: "DELETE" });
      setApplications((current) => current.filter((item) => item.id !== application.id));
    } catch {
      setFormError(t("applicationUpdateError"));
    }
  }

  function openApplicationForm(scheme?: Scheme) {
    setForm({ scheme_name: scheme?.name || "", application_number: "", applied_date: "", tracking_url: scheme?.apply_url || "" });
    setFormError("");
    setFormOpen(true);
  }

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
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">{t("savedSchemesHeading")}</h2>
            <button type="button" onClick={() => openApplicationForm()} className="rounded-md bg-banyan px-4 py-2 text-sm font-medium text-white hover:opacity-90">{t("addApplication")}</button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {schemes.map((s) => (
              <div key={s.id}>
                <SchemeCard scheme={s} />
                <button type="button" onClick={() => openApplicationForm(s)} className="mt-2 text-sm font-medium text-banyan underline">{t("trackThisScheme")}</button>
              </div>
            ))}
            {schemes.length === 0 && <p className="text-inkmuted">{t("nothingSaved")}</p>}
          </div>

          {formOpen && (
            <form onSubmit={createApplication} className="mt-8 grid gap-4 border-y border-ink/15 py-6 md:grid-cols-2">
              <h2 className="font-display text-xl font-semibold md:col-span-2">{t("addApplication")}</h2>
              <label className="grid gap-1 text-sm">{t("schemeName")}
                <input required maxLength={255} value={form.scheme_name} onChange={(event) => setForm({ ...form, scheme_name: event.target.value })} className="rounded-md border border-ink/20 px-3 py-2" />
              </label>
              <label className="grid gap-1 text-sm">{t("applicationNumber")}
                <input required maxLength={120} value={form.application_number} onChange={(event) => setForm({ ...form, application_number: event.target.value })} className="rounded-md border border-ink/20 px-3 py-2" />
              </label>
              <label className="grid gap-1 text-sm">{t("applicationDate")}
                <input required type="date" value={form.applied_date} onChange={(event) => setForm({ ...form, applied_date: event.target.value })} className="rounded-md border border-ink/20 px-3 py-2" />
              </label>
              <label className="grid gap-1 text-sm">{t("trackingPortalUrl")}
                <input required type="url" pattern="https://.*" placeholder="https://" value={form.tracking_url} onChange={(event) => setForm({ ...form, tracking_url: event.target.value })} className="rounded-md border border-ink/20 px-3 py-2" />
              </label>
              <p className="text-sm text-inkmuted md:col-span-2">{t("manualTrackingNotice")}</p>
              {formError && <p role="alert" className="text-sm text-alert md:col-span-2">{formError}</p>}
              <div className="flex gap-3 md:col-span-2">
                <button type="submit" className="rounded-md bg-banyan px-4 py-2 text-sm font-medium text-white">{t("saveApplication")}</button>
                <button type="button" onClick={() => setFormOpen(false)} className="rounded-md border border-ink/20 px-4 py-2 text-sm">{t("cancel")}</button>
              </div>
            </form>
          )}
          {formError && !formOpen && <p role="alert" className="mt-4 text-sm text-alert">{formError}</p>}

          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold">{t("trackedApplications")}</h2>
            {applications.length === 0 ? <p className="mt-3 text-inkmuted">{t("noApplications")}</p> : (
              <div className="mt-4 divide-y divide-ink/15">
                {applications.map((application) => (
                  <article key={application.id} className="grid gap-4 py-5 md:grid-cols-[1fr_auto]">
                    <div>
                      <h3 className="font-semibold">{application.scheme_name}</h3>
                      <p className="mt-1 text-sm text-inkmuted">{t("applicationNumber")}: {application.application_number} · {t("applicationDate")}: {application.applied_date}</p>
                      <p className="mt-2 text-sm">{t("currentStatus")}: <span className="font-semibold">{t(`status_${application.status}` as "status_pending")}</span> · {t("manualStatus")}</p>
                      <ol className="mt-3 space-y-2 border-l border-ink/20 pl-4">
                        {application.timeline.map((entry, index) => (
                          <li key={`${entry.date}-${index}`} className="text-sm">
                            <span className="font-medium">{entry.date}</span> · {t(`status_${entry.status}` as "status_pending")} · {t("manualStatus")}
                            {entry.note && <span className="block text-inkmuted">{entry.note}</span>}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="flex flex-wrap items-start gap-2 md:justify-end">
                      <label className="sr-only" htmlFor={`status-${application.id}`}>{t("updateStatus")}</label>
                      <select id={`status-${application.id}`} value={statusDrafts[application.id] || application.status} onChange={(event) => setStatusDrafts({ ...statusDrafts, [application.id]: event.target.value as ApplicationTrack["status"] })} className="rounded-md border border-ink/20 px-3 py-2 text-sm">
                        {["pending", "under_review", "approved", "rejected", "disbursed"].map((status) => <option key={status} value={status}>{t(`status_${status}` as "status_pending")}</option>)}
                      </select>
                      <button type="button" onClick={() => updateStatus(application)} className="rounded-md border border-ink/20 px-3 py-2 text-sm">{t("updateStatus")}</button>
                      {application.tracking_url && <a href={application.tracking_url} target="_blank" rel="noopener noreferrer" className="rounded-md bg-banyan px-3 py-2 text-sm font-medium text-white">{t("trackApplicationStatus")}</a>}
                      <button type="button" onClick={() => removeApplication(application)} className="rounded-md border border-alert/30 px-3 py-2 text-sm text-alert">{t("removeApplication")}</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
