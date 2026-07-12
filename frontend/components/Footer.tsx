"use client";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import SealMark from "@/components/SealMark";

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="mt-20 border-t border-line bg-khadiraised">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 text-ink">
            <span className="text-banyan"><SealMark size={26} /></span>
            <span className="font-display text-lg font-semibold">SchemeSetu</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-inkmuted">{t("disclaimer")}</p>
        </div>
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-inkmuted">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/check" className="hover:text-banyan">{t("navCheck")}</Link></li>
            <li><Link href="/schemes" className="hover:text-banyan">{t("navSchemes")}</Link></li>
            <li><Link href="/assistant" className="hover:text-banyan">{t("navAssistant")}</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-inkmuted">Sources</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a className="hover:text-banyan underline decoration-line underline-offset-2" href="https://www.myscheme.gov.in" target="_blank" rel="noreferrer">
                myScheme.gov.in ↗
              </a>
            </li>
            <li className="text-inkmuted">Official ministry portals</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4">
        <p className="container-page font-mono text-xs text-inkmuted">
          Independent, open-source project. Not affiliated with the Government of India.
        </p>
      </div>
    </footer>
  );
}
