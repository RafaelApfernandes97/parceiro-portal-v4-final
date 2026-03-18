import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Activate() {
  const { token } = useParams<{ token: string }>();
  const { activate } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setError('Token inválido.'); setLoading(false); return; }
    activate(token)
      .then(() => { setLoading(false); setSuccess(true); setTimeout(() => navigate('/company-profile'), 2000); })
      .catch((err) => { setLoading(false); setError(err.response?.data?.error || 'Token inválido ou expirado.'); });
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.brand}>MAIS CHAT</h1>
          <p style={styles.sub}>Portal de Parceiros</p>
        </div>
        {loading && (
          <div style={{ textAlign: 'center' }}>
            <div style={styles.spinner} />
            <p style={{ color: '#666', marginTop: 8 }}>Ativando sua conta...</p>
          </div>
        )}
        {success && (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 48, color: '#27AE60' }}>&#10003;</span>
            <h2 style={{ color: '#27AE60', margin: '12px 0 0' }}>Conta Ativada!</h2>
            <p style={{ color: '#666', marginTop: 8 }}>Redirecionando para o cadastro da empresa...</p>
          </div>
        )}
        {error && (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 48, color: '#C0392B' }}>&#10005;</span>
            <h2 style={{ color: '#C0392B', margin: '12px 0 0' }}>Erro na Ativação</h2>
            <p style={{ color: '#666', marginTop: 8 }}>{error}</p>
            <Link to="/login" style={{ display: 'inline-block', marginTop: 16, color: '#1B5E8C', fontWeight: 600 }}>Ir para o Login</Link>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1B5E8C, #134263)', padding: 24 },
  card: { background: '#fff', borderRadius: 16, padding: '48px 40px', width: '100%', maxWidth: 420, boxShadow: '0 12px 40px rgba(0,0,0,0.2)', textAlign: 'center' },
  header: { marginBottom: 32 },
  brand: { fontSize: 28, color: '#1B5E8C', margin: 0 },
  sub: { fontSize: 13, color: '#888', marginTop: 2 },
  spinner: { width: 40, height: 40, border: '4px solid #EAF2F8', borderTopColor: '#1B5E8C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' },
};
