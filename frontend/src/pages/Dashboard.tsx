import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { STATUS_LABELS } from '../utils/constants';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    api.get('/indication', { params: { page: 1, limit: 5 } }).then(res => {
      setRecent(res.data.indications);
      setStats({ ...res.data.stats, total: res.data.total });
    }).catch(() => {});
  }, []);

  return (
    <div style={styles.wrap}>
      <div>
        <h1 style={styles.h1}>Olá, {user?.nome || 'Parceiro'}!</h1>
        <p style={styles.sub}>Bem-vindo ao Portal de Parceiros da Mais Chat.</p>
      </div>
      <div style={styles.grid}>
        <StatCard label="Total de Indicações" value={stats.total || 0} />
        <StatCard label="Sucesso" value={stats.sucesso || 0} color="#27AE60" />
        <StatCard label="Em Negociação" value={stats.em_negociacao || 0} color="#F39C12" />
        <StatCard label="Novas" value={stats.nova || 0} color="#1B5E8C" />
      </div>
      <div style={styles.actions}>
        <Link to="/indication/new" style={styles.actionCard}>
          <span style={styles.actionIcon}>+</span>
          <span style={styles.actionText}>Nova Indicação</span>
        </Link>
        <Link to="/indications" style={styles.actionCard}>
          <span style={styles.actionIcon}>&#128203;</span>
          <span style={styles.actionText}>Ver Indicações</span>
        </Link>
      </div>
      {recent.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.h2}>Indicações Recentes</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Data</th>
                  <th style={styles.th}>Empresa</th>
                  <th style={styles.th}>CNPJ</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((ind: any) => (
                  <tr key={ind._id}>
                    <td style={styles.td}>{new Date(ind.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td style={styles.td}>{ind.nomeEmpresa}</td>
                    <td style={styles.td}>{ind.cnpj}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: STATUS_LABELS[ind.status]?.bg, color: STATUS_LABELS[ind.status]?.color }}>
                        {STATUS_LABELS[ind.status]?.label || ind.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color = '#1B5E8C' }: { label: string; value: number; color?: string }) {
  return (
    <div style={styles.statCard}>
      <span style={{ ...styles.statNum, color }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' },
  h1: { fontSize: 24, color: '#1B5E8C', margin: 0 },
  sub: { color: '#666', margin: '4px 0 24px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  statCard: { background: '#fff', border: '1px solid #D8DEE4', borderRadius: 12, padding: 20, textAlign: 'center' },
  statNum: { display: 'block', fontSize: 32, fontWeight: 700 },
  statLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  actions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 },
  actionCard: { display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '2px solid #D8DEE4', borderRadius: 12, padding: 20, textDecoration: 'none' },
  actionIcon: { fontSize: 28, width: 48, height: 48, borderRadius: 12, background: '#EAF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1B5E8C', fontWeight: 700 },
  actionText: { fontSize: 16, fontWeight: 600, color: '#2A2A2A' },
  card: { background: '#fff', border: '1px solid #D8DEE4', borderRadius: 12, padding: 24 },
  h2: { fontSize: 16, color: '#1B5E8C', margin: '0 0 16px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '10px 12px', background: '#F7F9FB', borderBottom: '2px solid #D8DEE4', color: '#5A6672', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  td: { padding: '10px 12px', borderBottom: '1px solid #F2F3F4', color: '#333' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 },
};
