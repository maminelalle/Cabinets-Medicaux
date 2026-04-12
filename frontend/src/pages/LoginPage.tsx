import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { setSession } from "../lib/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@cabinet.mr");
  const [password, setPassword] = useState("password123");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email || !password) {
      return;
    }

    setSession("demo-access-token", "ADMIN");
    navigate("/dashboard", { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_20%,#dbeafe,transparent_40%),radial-gradient(circle_at_80%_0%,#e2e8f0,transparent_35%),#f8fafc] px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">Connexion</h1>
        <p className="mt-1 text-sm text-slate-600">Acces a l&apos;application de gestion du cabinet</p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
              required
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
              required
            />
          </label>

          <button type="submit" className="mt-2 rounded-md bg-blue-700 px-4 py-2 text-white hover:bg-blue-600">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
