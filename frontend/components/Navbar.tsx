"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang, Lang, LANGUAGES } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import SealMark from "@/components/SealMark";

export default function Navbar() {
  const { lang, setLang, t } = useLang();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const links = [
    { href: "/check", label: t("navCheck") },
    { href: "/schemes", label: t("navSchemes") },
    { href: "/assistant", label: t("navAssistant") },
    { href: "/documents", label: t("navDocuments") },
    { href: "/compare", label: t("navCompare") },
    ...(user ? [{ href: "/saved", label: t("navSaved") }] : []),
  ];

  const currentLangObj = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40">
      <div className="h-[3px] w-full bg-gradient-to-r from-saffron via-khadiraised to-banyan" />
      <div className="border-b border-line bg-khadi/95 backdrop-blur supports-[backdrop-filter]:bg-khadi/85">
        <div className="container-page flex h-16 items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="text-banyan">
              <SealMark size={34} />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-ink">
              Namba <span className="text-saffrondeep">SchemeSetu</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-5 text-sm font-medium lg:flex" aria-label="Main">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`relative py-1 transition hover:text-banyan ${
                    active ? "font-semibold text-banyan" : "text-ink"
                  }`}
                >
                  {l.label}
                  {active && (
                    <span className="absolute -bottom-[19px] left-0 right-0 h-[2.5px] bg-banyan rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side controls: Language Switcher & Auth */}
          <div className="hidden items-center gap-3 sm:flex">
            {/* 4-Language Dropdown Selector */}
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setLangMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:border-banyan focus:outline-none focus:ring-2 focus:ring-banyan/20"
                aria-expanded={langMenuOpen}
                aria-haspopup="listbox"
                aria-label="Select Language"
              >
                <span className="text-sm">🌐</span>
                <span className="font-medium">{currentLangObj.native}</span>
                <svg
                  className={`h-3 w-3 text-inkmuted transition-transform ${langMenuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {langMenuOpen && (
                <div
                  className="absolute right-0 mt-1.5 w-40 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  role="listbox"
                >
                  {LANGUAGES.map((l) => {
                    const isSelected = l.code === lang;
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setLang(l.code);
                          setLangMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-3.5 py-2 text-xs transition ${
                          isSelected
                            ? "bg-banyanlight font-semibold text-banyan"
                            : "text-ink hover:bg-khadiraised"
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span className="font-medium">{l.native}</span>
                        <span className="text-[11px] text-inkmuted">{l.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden xl:inline text-xs font-medium text-inkmuted max-w-[120px] truncate">
                  {user.name}
                </span>
                <button onClick={logout} className="btn-ghost text-sm py-1.5 px-3">
                  {t("logout")}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn-ghost text-sm py-1.5 px-3">
                  {t("login")}
                </Link>
                <Link href="/register" className="btn-primary text-xs py-1.5 px-3">
                  {t("register")}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu hamburger toggle */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              <span className="sr-only">Menu</span>
              {open ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 4H16M2 9H16M2 14H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {open && (
          <div className="border-t border-line bg-khadi sm:hidden animate-in slide-in-from-top-2 duration-150">
            <nav className="container-page flex flex-col gap-1 py-3" aria-label="Mobile">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    pathname === l.href ? "bg-banyanlight font-semibold text-banyan" : "text-ink hover:bg-white"
                  }`}
                >
                  {l.label}
                </Link>
              ))}

              {/* Mobile 4-Language selector pills */}
              <div className="mt-2 border-t border-line pt-3">
                <p className="px-2 text-xs font-semibold text-inkmuted uppercase tracking-wider mb-2">Language / மொழி / भाषा / భాష</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {LANGUAGES.map((l) => {
                    const isSelected = l.code === lang;
                    return (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLang(l.code);
                        }}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition text-left flex items-center justify-between ${
                          isSelected
                            ? "border-banyan bg-banyan text-white shadow-sm"
                            : "border-line bg-white text-ink hover:border-banyan/50"
                        }`}
                      >
                        <span>{l.native}</span>
                        {isSelected && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Auth button */}
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                {user ? (
                  <div className="flex w-full items-center justify-between">
                    <span className="text-xs font-semibold text-ink">{user.name}</span>
                    <button
                      onClick={() => {
                        logout();
                        setOpen(false);
                      }}
                      className="btn-ghost text-xs"
                    >
                      {t("logout")}
                    </button>
                  </div>
                ) : (
                  <div className="flex w-full gap-2">
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="btn-ghost flex-1 text-center text-xs"
                    >
                      {t("login")}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setOpen(false)}
                      className="btn-primary flex-1 text-center text-xs"
                    >
                      {t("register")}
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
