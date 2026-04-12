import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./components/routing/ProtectedRoute";
import ConsultationsPage from "./pages/ConsultationsPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import MedecinsPage from "./pages/MedecinsPage";
import PatientsPage from "./pages/PatientsPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import RendezVousPage from "./pages/RendezVousPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/medecins" element={<MedecinsPage />} />
          <Route path="/rendezvous" element={<RendezVousPage />} />
          <Route path="/consultations" element={<ConsultationsPage />} />
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
