import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login, isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isLoggedIn) {
    redirectByRole(user, navigate);
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      // After login, user state updates. Read from localStorage for redirect
      const u = JSON.parse(localStorage.getItem('mc_user') || '{}');
      redirectByRole(u, navigate);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.brand}>MAIS CHAT</h1>
          <p style={styles.sub}>Portal de Parceiros</p>
        </div>
        <h2 style={styles.title}>Entrar</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>E-mail</label>
            <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Senha</label>
            <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p style={styles.link}>Não tem conta? <Link to="/register" style={styles.a}>Cadastre-se</Link></p>
      </div>
    </div>
  );
}

function redirectByRole(user: any, navigate: any) {
  if (!user) return;
  if (user.role === 'admin') navigate('/admin');
  else if (user.onboardingStep === 'company_data') navigate('/company-profile');
  else if (user.onboardingStep === 'contract') navigate('/contract');
  else navigate('/dashboard');
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1B5E8C 0%, #134263 100%)', padding: 24 },
  card: { background: '#fff', borderRadius: 16, padding: '48px 40px', width: '100%', maxWidth: 420, boxShadow: '0 12px 40px rgba(0,0,0,0.2)' },
  header: { textAlign: 'center', marginBottom: 32 },
  brand: { fontSize: 28, color: '#1B5E8C', letterSpacing: 1, margin: 0 },
  sub: { fontSize: 13, color: '#888', marginTop: 2 },
  title: { fontSize: 20, marginBottom: 24, color: '#2A2A2A' },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#5A6672', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { width: '100%', padding: '12px 16px', border: '1.5px solid #D8DEE4', borderRadius: 8, fontSize: 15, background: '#F7F9FB', boxSizing: 'border-box' },
  btn: { width: '100%', padding: 14, background: '#1B5E8C', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
  error: { background: '#FDEDEC', color: '#C0392B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 },
  link: { textAlign: 'center', marginTop: 20, fontSize: 14, color: '#666' },
  a: { color: '#1B5E8C', fontWeight: 600, textDecoration: 'none' },
};
