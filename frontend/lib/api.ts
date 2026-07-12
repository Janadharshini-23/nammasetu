export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type DocumentHelp = { name: string; how_to: string; url?: string };
export type Scheme = {
  id: number; slug: string; name: string; ministry?: string; level: string;
  tags: string[]; summary?: string; benefits?: string; eligibility_text?: string;
  documents: string[]; document_help: DocumentHelp[]; apply_url?: string;
};
export type Criterion = { label: string; status: "met" | "not_met" | "unknown" };
export type MatchResult = { scheme: Scheme; verdict: string; score: number; criteria: Criterion[] };
export type EligibilityOut = { eligible: MatchResult[]; likely: MatchResult[]; not_eligible_count: number };
export type SmartCheckOut = {
  narrative: string; used_llm: boolean;
  eligible: MatchResult[]; likely: MatchResult[]; not_eligible_count: number;
};
export type HealthOut = { status: string; llm_configured: boolean; llm_model: string | null; llm_warning: string | null };

export function getToken(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem("token");
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try { detail = (await res.json()).detail || detail; } catch {}
    throw new Error(detail);
  }
  return res.json();
}

/** Appends ?lang=xx (or &lang=xx) to a path for endpoints that localize their response. */
export function withLang(path: string, lang: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}lang=${lang}`;
}
