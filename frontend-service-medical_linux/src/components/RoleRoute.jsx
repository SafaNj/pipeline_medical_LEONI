import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleRoute = ({ allowedRole, allowedMedType, children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole === 'medecin' && user.med_type !== allowedMedType) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RoleRoute;