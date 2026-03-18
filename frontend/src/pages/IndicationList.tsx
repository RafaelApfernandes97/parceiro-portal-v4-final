import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { STATUS_LABELS } from '../utils/constants';

export default function IndicationList() {
  const [indications, setIndications] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<any>({});
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const statusKeys = ['nova', 'em_negociacao', 'sucesso', 'insucesso', 'pausada'];

  useEffect(() => { load(); }, [page, filterStatus]);

  function load() {
    setLoading(true);
    const params: any = { page, limit: 20 };
    if (filterStatus) params.status = filterStatus;
    api.get('/indication', { params }).then(res => {
      setIndications(res.data.indications);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
      setStats(res.data.stats);
    }).finally(() => setLoading(false));
  }

  function filter(s: string) { setFilterStatus(s); setPage(1); }

  return (
    <div style={styles.wrap}>
      <div style={styles.pageHeader}>
        <h1 style={styles.h1}>Minhas Indicações</h1>
        <p style={styles.sub}>Acompanhe o status de todas as suas indicações.</p>
      </div>
      <div style={styles.filters}>
        <button style={{ ...styles.filterBtn, ...(filterStatus === '' ? styles.filterActive : {}) }} onClick={() => filter('')}>Todas ({total})</button>
        {statusKeys.map(s => (
          <button key={s} style={{ ...styles.filterBtn, ...(filterStatus === s ? styles.filterActive : {}), borderColor: filterStatus === s ? STATUS_LABELS[s].color : '#D8DEE4' }} onClick={() => filter(s)}>
            {STATUS_LABELS[s].label} ({stats[s] || 0})
          </button>
        ))}
      </div>
      {indications.length === 0 && !loading ? (
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <p style={{ color: '#888', fontSize: 15 }}>Nenhuma indicação encontrada. <Link to="/indication/new" style={{ color: '#1B5E8C', fontWeight: 600 }}>Faça sua primeira indicação!</Link></p>
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Data</th><th style={styles.th}>Empresa</th><th style={styles.th}>CNPJ</th>
                <th style={styles.th}>Segmento</th><th style={styles.th}>Contato</th><th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {indications.map((ind: any) => (
                <tr key={ind._id}>
                  <td style={styles.td}>{new Date(ind.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{ind.nomeEmpresa}</td>
                  <td style={styles.td}>{ind.cnpj}</td>
                  <td style={styles.td}>{ind.segmento}</td>
                  <td style={styles.td}>{ind.nomeContato}<br /><small style={{ color: '#888', fontSize: 11 }}>{ind.emailContato}</small></td>
                  <td style={styles.td}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: STATUS_LABELS[ind.status]?.bg, color: STATUS_LABELS[ind.status]?.color }}>
                      {STATUS_LABELS[ind.status]?.label || ind.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button style={styles.pageBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
          <span>Página {page} de {totalPages}</span>
          <button style={styles.pageBtn} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 1000, margin: '0 auto', padding: '32px 24px 80px' },
  pageHeader: { marginBottom: 20 },
  h1: { fontSize: 24, color: '#1B5E8C', margin: '0 0 4px' },
  sub: { color: '#666', fontSize: 14, margin: 0 },
  filters: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  filterBtn: { padding: '7px 16px', border: '2px solid #D8DEE4', borderRadius: 20, background: '#fff', fontSize: 13, fontWeight: 600, color: '#666', cursor: 'pointer' },
  filterActive: { borderColor: '#1B5E8C', background: '#EAF2F8', color: '#1B5E8C' },
  card: { background: '#fff', border: '1px solid #D8DEE4', borderRadius: 12, padding: 32 },
  tableWrap: { overflowX: 'auto', background: '#fff', border: '1px solid #D8DEE4', borderRadius: 12 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: 12, background: '#F7F9FB', borderBottom: '2px solid #D8DEE4', fontSize: 11, textTransform: 'uppercase', color: '#5A6672', letterSpacing: 0.5 },
  td: { padding: '10px 12px', borderBottom: '1px solid #F2F3F4', color: '#333', verticalAlign: 'top' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16 },
  pageBtn: { padding: '8px 16px', border: '1px solid #D8DEE4', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 600 },
};
