import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SiteAssignmentWarning from './common/SiteAssignmentWarning';

const SITE_BOUND_ROLE = (role = '', medType = '') => {
  const r = String(role || '').toLowerCase();
  const m = String(medType || '').toLowerCase();
  return r === 'infirmier' || r === 'rh' || r === 'hsse' || (r === 'medecin' && m === 'travail');
};

const PrivateRoute = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.must_change_password && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // Block access for users with roles that require a site but have no site assigned
  if (SITE_BOUND_ROLE(user?.role, user?.med_type) && (user?.site_id === null || user?.site_id === undefined || String(user?.site_id).trim() === '')) {
    // Show a blocking warning (SiteAssignmentWarning) instead of rendering the requested route
    return (
      <div style={{ padding: 20 }}>
        <SiteAssignmentWarning />
        <div style={{ marginTop: 12 }}>
          <strong>Accès bloqué :</strong> votre compte n'est pas assigné à un site. Contactez l'administrateur.
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default PrivateRoute;
