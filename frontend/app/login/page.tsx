"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import SealMark from "@/components/SealMark";

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true); setError("");
    try {
      const out = await api<{ access_token: string; name: string; email: string }>("/api/auth/login", {
        method: "POST", body: JSON.stringify({ email, password }),
      });
      login(out.access_token, out.name, out.email);
      router.push("/saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="container-page flex max-w-md flex-col items-center py-16">
      <span className="text-banyan"><SealMark size={40} /></span>
      <h1 className="mt-3 font-display text-3xl font-semibold">{t("login")}</h1>
      <div className="card mt-6 w-full space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        {error && <p className="bg-alertlight p-2.5 text-sm text-alert border border-alert/20 rounded-lg">{error}</p>}
        <button onClick={submit} disabled={loading} className="btn-primary w-full">{loading ? "…" : t("login")}</button>
        <p className="text-sm text-inkmuted">New here? <Link href="/register" className="text-banyan underline">{t("register")}</Link></p>
      </div>
    </div>
  );
}
