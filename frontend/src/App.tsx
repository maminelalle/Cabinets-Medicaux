import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./components/routing/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import PlaceholderPage from "./pages/PlaceholderPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/patients"
            element={<PlaceholderPage title="Patients" description="Liste, creation et edition des patients." />}
          />
          <Route
            path="/medecins"
            element={<PlaceholderPage title="Medecins" description="Gestion des medecins et disponibilites." />}
          />
          <Route
            path="/rendezvous"
            element={<PlaceholderPage title="Rendez-vous" description="Planification et suivi des rendez-vous." />}
          />
          <Route
            path="/consultations"
            element={<PlaceholderPage title="Consultations" description="Suivi medical des consultations." />}
          />
          <Route
            path="/prescriptions"
            element={<PlaceholderPage title="Prescriptions" description="Prescriptions et details des traitements." />}
          />
          <Route
            path="/medicaments"
            element={<PlaceholderPage title="Medicaments" description="Inventaire, stock et alertes." />}
          />
          <Route
            path="/dossiers"
            element={<PlaceholderPage title="Dossiers medicaux" description="Documents et historique patient." />}
          />
          <Route
            path="/rapports"
            element={<PlaceholderPage title="Rapports" description="Statistiques et indicateurs du cabinet." />}
          />
          <Route
            path="/admin/users"
            element={<PlaceholderPage title="Utilisateurs" description="Gestion des comptes par administrateur." />}
          />
          <Route
            path="/settings"
            element={<PlaceholderPage title="Parametres" description="Configuration du cabinet." />}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
