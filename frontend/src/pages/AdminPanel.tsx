import { useEffect, useState } from 'react';
import api from '../api/axios';
import { STATUS_LABELS } from '../utils/constants';

export default function AdminPanel() {
  const [tab, setTab] = useState<'dashboard' | 'indications' | 'partners'>('dashboard');
  const statusKeys = ['nova', 'em_negociacao', 'sucesso', 'insucesso', 'pausada'];

  // Dashboard state
  const [dashboard, setDashboard] = useState<any>({ totalPartners: 0, activePartners: 0, totalIndications: 0, statusBreakdown: {}, recentIndications: [] });

  // Indications state
  const [indications, setIndications] = useState<any[]>([]);
  const [indPage, setIndPage] = useState(1);
  const [indTotalPages, setIndTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Partners state
  const [partners, setPartners] = useState<any[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedIndication, setSelectedIndication] = useState<any>(null);
  const [obsText, setObsText] = useState('');

  useEffect(() => { loadDashboard(); }, []);

  function loadDashboard() {
    api.get('/admin/dashboard').then(res => setDashboard(res.data)).catch(() => {});
  }

  function loadIndications() {
    const params: any = { page: indPage, limit: 30 };
    if (filterStatus) params.status = filterStatus;
    if (searchTerm) params.search = searchTerm;
    api.get('/admin/indications', { params }).then(res => {
      setIndications(res.data.indications);
      setIndTotalPages(res.data.totalPages);
    }).catch(() => {});
  }

  function loadPartners() {
    api.get('/admin/partners').then(res => setPartners(res.data.partners)).catch(() => {});
  }

  function onStatusChange(indication: any, newStatus: string) {
    api.put(`/admin/indication/${indication._id}/status`, { status: newStatus }).then(() => {
      indication.status = newStatus;
      setIndications([...indications]);
      loadDashboard();
    }).catch(() => {});
  }

  function openObs(indication: any) {
    setSelectedIndication(indication);
    setObsText(indication.observacaoAdmin || '');
    setShowModal(true);
  }

  function saveObs() {
    if (!selectedIndication) return;
    api.put(`/admin/indication/${selectedIndication._id}/status`, { status: selectedIndication.status, observacao: obsText }).then(() => {
      selectedIndication.observacaoAdmin = obsText;
      setShowModal(false);
    }).catch(() => {});
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.pageHeader}>
        <h1 style={styles.h1}>Painel Administrativo</h1>
        <p style={styles.sub}>Gerencie parceiros e indicações da Mais Chat.</p>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button style={{ ...styles.tabBtn, ...(tab === 'dashboard' ? styles.tabActive : {}) }} onClick={() => setTab('dashboard')}>Dashboard</button>
        <button style={{ ...styles.tabBtn, ...(tab === 'indications' ? styles.tabActive : {}) }} onClick={() => { setTab('indications'); loadIndications(); }}>Indicações</button>
        <button style={{ ...styles.tabBtn, ...(tab === 'partners' ? styles.tabActive : {}) }} onClick={() => { setTab('partners'); loadPartners(); }}>Parceiros</button>
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && (
        <>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}><span style={styles.num}>{dashboard.totalPartners}</span><span style={styles.lbl}>Parceiros</span></div>
            <div style={styles.statCard}><span style={styles.num}>{dashboard.activePartners}</span><span style={styles.lbl}>Ativos</span></div>
            <div style={styles.statCard}><span style={styles.num}>{dashboard.totalIndications}</span><span style={styles.lbl}>Indicações</span></div>
            <div style={styles.statCard}><span style={{ ...styles.num, color: '#27AE60' }}>{dashboard.statusBreakdown?.sucesso || 0}</span><span style={styles.lbl}>Sucesso</span></div>
          </div>
          {dashboard.recentIndications?.length > 0 && (
            <div style={styles.card}>
              <h2 style={styles.h2}>Últimas Indicações</h2>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Data</th><th style={styles.th}>Empresa</th><th style={styles.th}>CNPJ</th><th style={styles.th}>Parceiro</th><th style={styles.th}>Status</th></tr></thead>
                <tbody>
                  {dashboard.recentIndications.map((i: any) => (
                    <tr key={i._id}>
                      <td style={styles.td}>{new Date(i.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{i.nomeEmpresa}</td>
                      <td style={styles.td}>{i.cnpj}</td>
                      <td style={styles.td}>{i.partnerId?.responsavel?.nome || i.partnerId?.email}</td>
                      <td style={styles.td}><span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: STATUS_LABELS[i.status]?.bg, color: STATUS_LABELS[i.status]?.color }}>{STATUS_LABELS[i.status]?.label || i.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Indications */}
      {tab === 'indications' && (
        <>
          <div style={styles.toolbar}>
            <input style={styles.searchInput} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar empresa, CNPJ ou contato..." onKeyDown={e => e.key === 'Enter' && loadIndications()} />
            <select style={styles.selectInput} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setTimeout(loadIndications, 0); }}>
              <option value="">Todos os Status</option>
              {statusKeys.map(s => <option key={s} value={s}>{STATUS_LABELS[s].label}</option>)}
            </select>
          </div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Data</th><th style={styles.th}>Empresa</th><th style={styles.th}>CNPJ</th><th style={styles.th}>Segmento</th><th style={styles.th}>Contato</th><th style={styles.th}>Parceiro</th><th style={styles.th}>Status</th><th style={styles.th}>Ação</th></tr></thead>
              <tbody>
                {indications.map((i: any) => (
                  <tr key={i._id}>
                    <td style={styles.td}>{new Date(i.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{i.nomeEmpresa}</td>
                    <td style={styles.td}>{i.cnpj}</td>
                    <td style={styles.td}>{i.segmento}</td>
                    <td style={styles.td}>{i.nomeContato}<br /><small style={{ color: '#888', fontSize: 10 }}>{i.emailContato}</small></td>
                    <td style={styles.td}>{i.partnerId?.responsavel?.nome || '—'}</td>
                    <td style={styles.td}>
                      <select style={styles.statusSelect} value={i.status} onChange={e => onStatusChange(i, e.target.value)}>
                        {statusKeys.map(s => <option key={s} value={s}>{STATUS_LABELS[s].label}</option>)}
                      </select>
                    </td>
                    <td style={styles.td}><button style={styles.btnMini} onClick={() => openObs(i)} title="Observação">💬</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {indTotalPages > 1 && (
            <div style={styles.pagination}>
              <button style={styles.pageBtn} disabled={indPage <= 1} onClick={() => { setIndPage(p => p - 1); setTimeout(loadIndications, 0); }}>←</button>
              <span>{indPage}/{indTotalPages}</span>
              <button style={styles.pageBtn} disabled={indPage >= indTotalPages} onClick={() => { setIndPage(p => p + 1); setTimeout(loadIndications, 0); }}>→</button>
            </div>
          )}
        </>
      )}

      {/* Partners */}
      {tab === 'partners' && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Nome</th><th style={styles.th}>E-mail</th><th style={styles.th}>Empresa</th><th style={styles.th}>CNPJ</th><th style={styles.th}>Indicações</th><th style={styles.th}>Status Conta</th></tr></thead>
            <tbody>
              {partners.map((p: any) => (
                <tr key={p._id}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{p.responsavel?.nome || '—'}</td>
                  <td style={styles.td}>{p.email}</td>
                  <td style={styles.td}>{p.company?.razaoSocial || '—'}</td>
                  <td style={styles.td}>{p.company?.cnpj || '—'}</td>
                  <td style={styles.td}>{p.totalIndications}</td>
                  <td style={styles.td}>
                    <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: p.onboardingStep === 'active' ? '#E8F8EF' : '#FEF3E2', color: p.onboardingStep === 'active' ? '#27AE60' : '#B7791F' }}>
                      {p.onboardingStep}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Observation Modal */}
      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, color: '#1B5E8C', margin: '0 0 12px' }}>Observação — {selectedIndication?.nomeEmpresa}</h3>
            <textarea style={styles.textarea} rows={4} value={obsText} onChange={e => setObsText(e.target.value)} placeholder="Adicionar observação..." />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
              <button style={styles.btnSec} onClick={() => setShowModal(false)}>Cancelar</button>
              <button style={styles.btn} onClick={saveObs}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' },
  pageHeader: { marginBottom: 20 },
  h1: { fontSize: 24, color: '#1B5E8C', margin: '0 0 4px' },
  sub: { color: '#666', fontSize: 14, margin: '0 0 20px' },
  tabs: { display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #D8DEE4' },
  tabBtn: { padding: '10px 20px', border: 'none', background: 'none', fontSize: 14, fontWeight: 600, color: '#888', cursor: 'pointer', borderBottom: '3px solid transparent', marginBottom: -2 },
  tabActive: { color: '#1B5E8C', borderBottomColor: '#1B5E8C' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  statCard: { background: '#fff', border: '1px solid #D8DEE4', borderRadius: 12, padding: 20, textAlign: 'center' },
  num: { display: 'block', fontSize: 32, fontWeight: 700, color: '#1B5E8C' },
  lbl: { fontSize: 12, color: '#888', textTransform: 'uppercase' },
  card: { background: '#fff', border: '1px solid #D8DEE4', borderRadius: 12, padding: 24, overflowX: 'auto' },
  h2: { fontSize: 16, color: '#1B5E8C', margin: '0 0 16px' },
  toolbar: { display: 'flex', gap: 12, marginBottom: 16 },
  searchInput: { flex: 1, padding: '10px 14px', border: '1.5px solid #D8DEE4', borderRadius: 8, fontSize: 14 },
  selectInput: { padding: 10, border: '1.5px solid #D8DEE4', borderRadius: 8, fontSize: 14 },
  tableWrap: { overflowX: 'auto', background: '#fff', border: '1px solid #D8DEE4', borderRadius: 12 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { textAlign: 'left', padding: 10, background: '#F7F9FB', borderBottom: '2px solid #D8DEE4', fontSize: 10, textTransform: 'uppercase', color: '#5A6672', letterSpacing: 0.5 },
  td: { padding: '8px 10px', borderBottom: '1px solid #F2F3F4', color: '#333', verticalAlign: 'top' },
  statusSelect: { padding: '4px 8px', border: '1px solid #D8DEE4', borderRadius: 6, fontSize: 12, cursor: 'pointer' },
  btnMini: { border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, padding: 4 },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 12 },
  pageBtn: { padding: '6px 14px', border: '1px solid #D8DEE4', borderRadius: 6, background: '#fff', cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: 12, padding: 28, width: '90%', maxWidth: 480 },
  textarea: { width: '100%', padding: 10, border: '1.5px solid #D8DEE4', borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' },
  btn: { padding: '10px 24px', background: '#1B5E8C', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' },
  btnSec: { padding: '10px 24px', background: '#fff', color: '#1B5E8C', border: '2px solid #1B5E8C', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
};
