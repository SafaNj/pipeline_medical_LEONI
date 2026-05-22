import { Navigate, Route, Routes } from 'react-router-dom';
import ChangePasswordPage from './pages/ChangePasswordPage';
import DashboardHSSE from './pages/DashboardHSSE';
import DashboardInfirmier from './pages/DashboardInfirmier';
import DashboardMedecinControleur from './pages/DashboardMedecinControleur';
import DashboardMedecinTraitant from './pages/DashboardMedecinTraitant';
import DashboardMedecinTravail from './pages/DashboardMedecinTravail';
import DashboardRH from './pages/DashboardRH';
import LoginPage from './pages/LoginPage';
import PrivateRoute from './components/PrivateRoute';
import RoleRoute from './components/RoleRoute';

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PrivateRoute />}>
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route
          path="/dashboard/medecin/traitant"
          element={(
            <RoleRoute allowedRole="medecin" allowedMedType="traitant">
              <DashboardMedecinTraitant />
            </RoleRoute>
          )}
        />
        <Route
          path="/dashboard/medecin/travail"
          element={(
            <RoleRoute allowedRole="medecin" allowedMedType="travail">
              <DashboardMedecinTravail />
            </RoleRoute>
          )}
        />
        <Route
          path="/dashboard/medecin/controleur"
          element={(
            <RoleRoute allowedRole="medecin" allowedMedType="controleur">
              <DashboardMedecinControleur />
            </RoleRoute>
          )}
        />
        <Route
          path="/dashboard/infirmier"
          element={(
            <RoleRoute allowedRole="infirmier">
              <DashboardInfirmier />
            </RoleRoute>
          )}
        />
        <Route
          path="/dashboard/rh"
          element={(
            <RoleRoute allowedRole="rh">
              <DashboardRH />
            </RoleRoute>
          )}
        />
        <Route
          path="/dashboard/hsse"
          element={(
            <RoleRoute allowedRole="hsse">
              <DashboardHSSE />
            </RoleRoute>
          )}
        />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
