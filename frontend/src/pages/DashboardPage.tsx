const cards = [
  { title: "Patients", value: "124" },
  { title: "Rendez-vous du jour", value: "18" },
  { title: "Consultations", value: "96" },
  { title: "Stock faible", value: "7" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">Vue globale de l activite du cabinet</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">{card.title}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900">Statut du projet</h2>
        <p className="mt-2 text-sm text-slate-600">
          Backend P1/P2 est en place. Les modules P3 principaux ont ete prepares. Prochaine etape: brancher les
          donnees reelles du dashboard depuis /api/rapports/dashboard.
        </p>
      </section>
    </div>
  );
}
