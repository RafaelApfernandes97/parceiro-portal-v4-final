import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  children: React.ReactNode;
  role?: 'admin' | 'partner';
  requireOnboarded?: boolean;
}

export default function ProtectedRoute({ children, role, requireOnboarded }: Props) {
  const { isLoggedIn, user } = useAuth();

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/login" replace />;

  if (requireOnboarded && user?.role === 'partner') {
    if (user.onboardingStep === 'company_data') return <Navigate to="/company-profile" replace />;
    if (user.onboardingStep === 'contract') return <Navigate to="/contract" replace />;
  }

  return <>{children}</>;
}
