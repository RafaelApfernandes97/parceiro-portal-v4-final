import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { SEGMENTOS } from '../utils/constants';
import { maskCNPJ, maskTel } from '../utils/masks';

export default function IndicationForm() {
  const [form, setForm] = useState({ nomeEmpresa: '', cnpj: '', segmento: '', site: '', nomeContato: '', emailContato: '', telefoneContato: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sentEmpresa, setSentEmpresa] = useState('');

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nomeEmpresa || !form.cnpj || !form.segmento || !form.nomeContato || !form.emailContato) {
      setError('Preencha todos os campos obrigatórios.'); return;
    }
    setLoading(true); setError('');
    try {
      await api.post('/indication', form);
      setSuccess(true);
      setSentEmpresa(form.nomeEmpresa);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao enviar indicação.');
    } finally { setLoading(false); }
  }

  if (success) {
    return (
      <div style={styles.wrap}>
        <div style={{ ...styles.card, textAlign: 'center', borderColor: '#27AE60' }}>
          <span style={{ fontSize: 48, color: '#27AE60', display: 'block', marginBottom: 8 }}>✓</span>
          <h2 style={{ color: '#27AE60' }}>Indicação Enviada!</h2>
          <p style={{ color: '#555', margin: '8px 0' }}><strong>{sentEmpresa}</strong> foi indicada com sucesso.</p>
          <p style={{ color: '#555' }}>A equipe da Mais Chat entrará em contato com a empresa indicada.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
            <button onClick={() => { setSuccess(false); setForm({ nomeEmpresa: '', cnpj: '', segmento: '', site: '', nomeContato: '', emailContato: '', telefoneContato: '' }); }} style={styles.btn}>Nova Indicação</button>
            <Link to="/indications" style={styles.btnSec}>Ver Indicações</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.pageHeader}>
        <h1 style={styles.h1}>Nova Indicação</h1>
        <p style={styles.sub}>Indique uma empresa para a Mais Chat e ganhe comissão recorrente.</p>
      </div>
      <div style={styles.card}>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Nome da Empresa *</label>
            <input style={styles.input} value={form.nomeEmpresa} onChange={e => set('nomeEmpresa', e.target.value)} placeholder="Razão social ou nome fantasia" />
          </div>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>CNPJ *</label>
              <input style={styles.input} value={form.cnpj} onChange={e => set('cnpj', maskCNPJ(e.target.value))} placeholder="00.000.000/0000-00" maxLength={18} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Segmento *</label>
              <select style={styles.input} value={form.segmento} onChange={e => set('segmento', e.target.value)}>
                <option value="">Selecione</option>
                {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Site</label>
            <input style={styles.input} value={form.site} onChange={e => set('site', e.target.value)} placeholder="https://www.empresa.com.br" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Nome do Contato *</label>
            <input style={styles.input} value={form.nomeContato} onChange={e => set('nomeContato', e.target.value)} placeholder="Nome da pessoa de contato" />
          </div>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>E-mail do Contato *</label>
              <input style={styles.input} type="email" value={form.emailContato} onChange={e => set('emailContato', e.target.value)} placeholder="contato@empresa.com" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Telefone do Contato</label>
              <input style={styles.input} value={form.telefoneContato} onChange={e => set('telefoneContato', maskTel(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} />
            </div>
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.actions}>
            <Link to="/dashboard" style={styles.btnSec}>Cancelar</Link>
            <button type="submit" disabled={loading} style={styles.btn}>{loading ? 'Enviando...' : 'Enviar Indicação'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 640, margin: '0 auto', padding: '32px 24px 80px' },
  pageHeader: { marginBottom: 24 },
  h1: { fontSize: 24, color: '#1B5E8C', margin: '0 0 4px' },
  sub: { color: '#666', fontSize: 14, margin: 0 },
  card: { background: '#fff', border: '1px solid #D8DEE4', borderRadius: 12, padding: 32 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#5A6672', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 },
  input: { width: '100%', padding: '10px 14px', border: '1.5px solid #D8DEE4', borderRadius: 8, fontSize: 14, background: '#F7F9FB', boxSizing: 'border-box' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  actions: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 },
  btn: { padding: '12px 28px', background: '#1B5E8C', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  btnSec: { padding: '12px 28px', background: '#fff', color: '#1B5E8C', border: '2px solid #1B5E8C', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' },
  error: { background: '#FDEDEC', color: '#C0392B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 8 },
};
