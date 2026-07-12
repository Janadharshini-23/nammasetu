"use client";
import Link from "next/link";
import { Scheme } from "@/lib/api";
import { useLang, TAG_LABELS } from "@/lib/i18n";

export default function SchemeCard({ scheme }: { scheme: Scheme }) {
  const { lang } = useLang();
  return (
    <Link href={`/schemes/${scheme.slug}`} className="card block transition hover:-translate-y-0.5 hover:border-banyan/40 hover:shadow-md">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {scheme.tags.map((tag) => <span key={tag} className="tag">{TAG_LABELS[tag]?.[lang] ?? tag}</span>)}
      </div>
      <h3 className="font-display text-lg font-semibold leading-snug">{scheme.name}</h3>
      {scheme.ministry && <p className="mt-0.5 text-xs text-inkmuted">{scheme.ministry}</p>}
      <p className="mt-2 text-sm text-inkmuted">{scheme.summary}</p>
      {scheme.benefits && <p className="mt-2 font-mono text-sm font-semibold text-banyandeep">{scheme.benefits}</p>}
    </Link>
  );
}
