"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import SealMark from "@/components/SealMark";

export default function Navbar() {
  const { lang, setLang, t } = useLang();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/check", label: t("navCheck") },
    { href: "/schemes", label: t("navSchemes") },
    { href: "/assistant", label: t("navAssistant") },
    ...(user ? [{ href: "/saved", label: t("navSaved") }] : []),
  ];

  return (
    <header className="sticky top-0 z-30">
      <div className="h-[3px] w-full bg-gradient-to-r from-saffron via-khadiraised to-banyan" />
      <div className="border-b border-line bg-khadi/95 backdrop-blur supports-[backdrop-filter]:bg-khadi/80">
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="text-banyan"><SealMark size={34} /></span>
            <span className="font-display text-xl font-semibold tracking-tight text-ink">
              Scheme<span className="text-saffrondeep">Setu</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium sm:flex" aria-label="Main">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`relative py-1 transition hover:text-banyan ${pathname === l.href ? "text-banyan" : "text-ink"}`}
              >
                {l.label}
                {pathname === l.href && <span className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-banyan" />}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="rounded-full border border-line bg-white px-3 py-1.5 font-mono text-xs font-semibold text-ink hover:border-banyan"
              aria-label="Switch language"
            >
              {lang === "en" ? "हिं" : "EN"}
            </button>
            {user ? (
              <button onClick={logout} className="btn-ghost text-sm">{t("logout")}</button>
            ) : (
              <Link href="/login" className="btn-ghost text-sm">{t("login")}</Link>
            )}
          </div>

          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white sm:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <span className="sr-only">Menu</span>
            {open ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4H16M2 9H16M2 14H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            )}
          </button>
        </div>

        {open && (
          <div className="border-t border-line bg-khadi sm:hidden">
            <nav className="container-page flex flex-col gap-1 py-3" aria-label="Mobile">
              {links.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className={`rounded-lg px-2 py-2.5 text-sm font-medium ${pathname === l.href ? "bg-banyanlight text-banyan" : "text-ink"}`}>
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 flex items-center gap-2 border-t border-line pt-3">
                <button
                  onClick={() => setLang(lang === "en" ? "hi" : "en")}
                  className="rounded-full border border-line bg-white px-3 py-1.5 font-mono text-xs font-semibold"
                >
                  {lang === "en" ? "हिं" : "EN"}
                </button>
                {user ? (
                  <button onClick={() => { logout(); setOpen(false); }} className="btn-ghost text-sm">{t("logout")}</button>
                ) : (
                  <Link href="/login" onClick={() => setOpen(false)} className="btn-ghost text-sm">{t("login")}</Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
