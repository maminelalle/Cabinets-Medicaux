import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { clearSession, getUserRole } from "../../lib/auth";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/patients", label: "Patients" },
  { to: "/medecins", label: "Medecins" },
  { to: "/rendezvous", label: "Rendez-vous" },
  { to: "/consultations", label: "Consultations" },
  { to: "/prescriptions", label: "Prescriptions" },
  { to: "/medicaments", label: "Medicaments" },
  { to: "/dossiers", label: "Dossiers" },
  { to: "/rapports", label: "Rapports" },
  { to: "/admin/users", label: "Utilisateurs" },
  { to: "/settings", label: "Parametres" },
];

export default function AppShell() {
  const navigate = useNavigate();
  const role = getUserRole() ?? "-";

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link to="/dashboard" className="font-semibold text-slate-900">
            Cabinets Medicaux
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Role: {role}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"
            >
              Deconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-3">
          <nav className="grid gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm transition ${
                    isActive ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="rounded-xl border border-slate-200 bg-white p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
