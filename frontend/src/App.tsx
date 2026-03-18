import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Activate from './pages/Activate';
import Dashboard from './pages/Dashboard';
import CompanyProfile from './pages/CompanyProfile';
import Contract from './pages/Contract';
import IndicationForm from './pages/IndicationForm';
import IndicationList from './pages/IndicationList';
import AdminPanel from './pages/AdminPanel';

export default function App() {
  const { isLoggedIn } = useAuth();

  return (
    <>
      {isLoggedIn && <Navbar />}
      <main style={{ minHeight: '100vh', background: '#F7F9FB', paddingTop: isLoggedIn ? 60 : 0 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/activate/:token" element={<Activate />} />
          <Route path="/dashboard" element={<ProtectedRoute requireOnboarded><Dashboard /></ProtectedRoute>} />
          <Route path="/company-profile" element={<ProtectedRoute><CompanyProfile /></ProtectedRoute>} />
          <Route path="/contract" element={<ProtectedRoute><Contract /></ProtectedRoute>} />
          <Route path="/indication/new" element={<ProtectedRoute requireOnboarded><IndicationForm /></ProtectedRoute>} />
          <Route path="/indications" element={<ProtectedRoute requireOnboarded><IndicationList /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminPanel /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </>
  );
}
