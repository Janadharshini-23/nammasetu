export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type DocumentHelp = { name: string; how_to: string; url?: string };
export type Scheme = {
  id: number;
  slug: string;
  name: string;
  ministry?: string;
  level: string;
  tags: string[];
  summary?: string;
  benefits?: string;
  eligibility_text?: string;
  documents: string[];
  document_help: DocumentHelp[];
  apply_url?: string;
};

export type ApplicationTrack = {
  id: number;
  scheme_name: string;
  scheme_slug?: string | null;
  application_number: string;
  applied_date: string;
  tracking_url?: string | null;
  status: "pending" | "under_review" | "approved" | "rejected" | "disbursed";
  status_source: "manual" | "official";
  status_note?: string | null;
  timeline: { date: string; status: string; note?: string | null; source?: string }[];
};

export type Criterion = { label: string; status: "met" | "not_met" | "unknown" };
export type MatchResult = { scheme: Scheme; verdict: string; score: number; criteria: Criterion[] };
export type EligibilityOut = { eligible: MatchResult[]; likely: MatchResult[]; not_eligible_count: number };
export type SmartCheckOut = {
  narrative: string;
  used_llm: boolean;
  eligible: MatchResult[];
  likely: MatchResult[];
  not_eligible_count: number;
};

export type TrackedDocument = {
  id: string;
  name: string;
  category: string;
  description: string;
  how_to: string;
  portal_url?: string;
  schemes_count: number;
  schemes: { id: number; slug: string; name: string }[];
  required_for_saved: boolean;
};

export type DocumentTrackerOut = {
  status: string;
  total_documents: number;
  user_authenticated: boolean;
  saved_schemes_count: number;
  documents: TrackedDocument[];
};

export type HealthOut = {
  status: string;
  llm_configured: boolean;
  llm_model: string | null;
  llm_warning: string | null;
};

export function getToken(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem("token");
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Could not connect to SchemeSetu API at ${API}${path} (${errorMsg}). Please check that the backend is running.`
    );
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

/** Appends ?lang=xx (or &lang=xx) to a path for endpoints that localize their response. */
export function withLang(path: string, lang: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}lang=${lang}`;
}
