import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#1B5E8C', padding: '0 24px', height: 60,
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: 0.5, lineHeight: 1.2 }}>MAIS CHAT</span>
        <span style={{ color: '#EAF2F8', fontSize: 10, opacity: 0.8 }}>Portal de Parceiros</span>
      </Link>
      <div style={{ display: 'flex', gap: 4 }}>
        {user?.role === 'partner' && (
          <>
            <NavLink to="/dashboard" active={isActive('/dashboard')}>Painel</NavLink>
            <NavLink to="/indication/new" active={isActive('/indication/new')}>Nova Indicação</NavLink>
            <NavLink to="/indications" active={isActive('/indications')}>Minhas Indicações</NavLink>
          </>
        )}
        {user?.role === 'admin' && (
          <NavLink to="/admin" active={isActive('/admin')}>Admin</NavLink>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{user?.nome || user?.email}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
          textTransform: 'uppercase', letterSpacing: 0.5,
          background: user?.role === 'admin' ? '#F39C12' : 'rgba(255,255,255,0.2)', color: '#fff'
        }}>{user?.role === 'admin' ? 'Admin' : 'Parceiro'}</span>
        <button onClick={logout} style={{
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff', padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
          fontSize: 12, fontWeight: 600
        }}>Sair</button>
      </div>
    </nav>
  );
}

function NavLink({ to, active, children }: { to: string; active: string; children: React.ReactNode }) {
  return (
    <Link to={to} style={{
      color: active ? '#fff' : 'rgba(255,255,255,0.8)', textDecoration: 'none',
      padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 500,
      background: active ? 'rgba(255,255,255,0.15)' : 'transparent'
    }}>{children}</Link>
  );
}
