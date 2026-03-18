import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

type ContractStatus = 'not_generated' | 'pending_signature' | 'signed' | 'error';

export default function Contract() {
  const { updateLocalUser } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ContractStatus>('not_generated');
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [signWarning, setSignWarning] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    setLoading(true);
    try {
      const res = await api.get('/contract/status');
      const s = res.data.status;
      setStatus(s);
      if (s === 'signed') {
        updateLocalUser({ onboardingStep: 'active' });
      }
    } catch {
      setStatus('not_generated');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    setError('');
    try {
      const res = await api.get('/contract/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'contrato-parceria.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao baixar o PDF.');
    } finally {
      setDownloading(false);
    }
  }

  async function handleSign() {
    setSigning(true);
    setError('');
    setSuccess(false);
    setSignWarning(false);
    try {
      const res = await api.post('/contract/generate-and-sign');
      if (res.data.signed) {
        setSuccess(true);
        setStatus('signed');
        updateLocalUser({ onboardingStep: 'active' });
        setTimeout(() => navigate('/dashboard'), 3000);
      } else {
        setSignWarning(true);
        setStatus('pending_signature');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao assinar o contrato.');
    } finally {
      setSigning(false);
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    setError('');
    try {
      await api.post('/contract/confirm-signed');
      setStatus('signed');
      setSuccess(true);
      updateLocalUser({ onboardingStep: 'active' });
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Contrato ainda não foi assinado por todas as partes.');
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.wrap}>
        <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Carregando status do contrato...</div>
      </div>
    );
  }

  if (status === 'signed' || success) {
    return (
      <div style={styles.wrap}>
        <div style={styles.successCard}>
          <span style={{ fontSize: 56, color: '#27AE60' }}>&#10003;</span>
          <h1 style={{ color: '#27AE60', margin: '16px 0 8px', fontSize: 24 }}>Contrato Assinado!</h1>
          <p style={{ color: '#666', fontSize: 15, lineHeight: 1.6 }}>
            Seu contrato de parceria foi assinado com sucesso.
            Você será redirecionado para o painel em instantes.
          </p>
          <button style={styles.btn} onClick={() => navigate('/dashboard')}>
            Ir para o Painel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <h1 style={styles.h1}>Contrato de Parceria</h1>
      <p style={styles.sub}>Revise e assine seu contrato para ativar sua conta de parceiro.</p>

      {error && <div style={styles.error}>{error}</div>}

      {signWarning && (
        <div style={styles.warningCard}>
          <h3 style={{ color: '#F39C12', margin: '0 0 8px' }}>Assinatura Pendente</h3>
          <p style={{ color: '#666', fontSize: 14, margin: '0 0 12px' }}>
            O contrato foi enviado para assinatura digital. Verifique seu e-mail para assinar o documento.
            Após assinar, clique no botão abaixo para confirmar.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={styles.btnOutline} onClick={checkStatus} disabled={loading}>
              Verificar Status
            </button>
            <button style={styles.btn} onClick={handleConfirm} disabled={confirming}>
              {confirming ? 'Confirmando...' : 'Confirmar Assinatura'}
            </button>
          </div>
        </div>
      )}

      <div style={styles.card}>
        <h2 style={styles.h2}>Ações do Contrato</h2>

        <div style={styles.actionRow}>
          <div style={styles.actionInfo}>
            <h3 style={styles.actionTitle}>Baixar Contrato (PDF)</h3>
            <p style={styles.actionDesc}>Faça o download do contrato para revisão antes de assinar.</p>
          </div>
          <button style={styles.btnOutline} onClick={handleDownload} disabled={downloading}>
            {downloading ? 'Baixando...' : 'Baixar PDF'}
          </button>
        </div>

        <div style={styles.divider} />

        <div style={styles.actionRow}>
          <div style={styles.actionInfo}>
            <h3 style={styles.actionTitle}>Assinar Contrato Digitalmente</h3>
            <p style={styles.actionDesc}>
              Ao clicar, o contrato será gerado e enviado para assinatura digital.
              Você receberá um e-mail com o link para assinar.
            </p>
          </div>
          <button style={styles.btn} onClick={handleSign} disabled={signing}>
            {signing ? 'Processando...' : 'Assinar Contrato'}
          </button>
        </div>

        {status === 'pending_signature' && !signWarning && (
          <>
            <div style={styles.divider} />
            <div style={styles.actionRow}>
              <div style={styles.actionInfo}>
                <h3 style={styles.actionTitle}>Já assinou o contrato?</h3>
                <p style={styles.actionDesc}>Se você já assinou o documento por e-mail, clique para confirmar e ativar sua conta.</p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button style={styles.btnOutline} onClick={checkStatus} disabled={loading}>
                  Verificar Status
                </button>
                <button style={styles.btn} onClick={handleConfirm} disabled={confirming}>
                  {confirming ? 'Confirmando...' : 'Confirmar Assinatura'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={styles.infoCard}>
        <h3 style={{ margin: '0 0 8px', color: '#1B5E8C', fontSize: 14 }}>Sobre o processo de assinatura</h3>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#666', fontSize: 13, lineHeight: 1.8 }}>
          <li>O contrato é gerado automaticamente com os dados informados no cadastro.</li>
          <li>A assinatura digital tem validade jurídica conforme a legislação brasileira.</li>
          <li>Após a assinatura, sua conta será ativada e você poderá começar a indicar clientes.</li>
          <li>Uma cópia do contrato assinado será enviada para o seu e-mail.</li>
        </ul>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 800, margin: '0 auto', padding: '32px 24px 80px' },
  h1: { fontSize: 24, color: '#1B5E8C', margin: 0 },
  sub: { color: '#666', margin: '4px 0 24px' },
  card: { background: '#fff', border: '1px solid #D8DEE4', borderRadius: 12, padding: 24, marginBottom: 20 },
  h2: { fontSize: 16, color: '#1B5E8C', margin: '0 0 20px', paddingBottom: 12, borderBottom: '1px solid #F2F3F4' },
  actionRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' as const },
  actionInfo: { flex: 1, minWidth: 250 },
  actionTitle: { margin: '0 0 4px', fontSize: 15, color: '#2A2A2A', fontWeight: 600 },
  actionDesc: { margin: 0, fontSize: 13, color: '#888', lineHeight: 1.5 },
  divider: { height: 1, background: '#F2F3F4', margin: '20px 0' },
  btn: { padding: '12px 28px', background: '#1B5E8C', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const },
  btnOutline: { padding: '12px 28px', background: '#fff', color: '#1B5E8C', border: '2px solid #1B5E8C', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const },
  error: { background: '#FDEDEC', color: '#C0392B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 },
  successCard: { background: '#fff', border: '2px solid #27AE60', borderRadius: 16, padding: '48px 40px', textAlign: 'center' as const, maxWidth: 500, margin: '60px auto' },
  warningCard: { background: '#FEF9E7', border: '1px solid #F9E79F', borderRadius: 12, padding: 20, marginBottom: 20 },
  infoCard: { background: '#EAF2F8', border: '1px solid #D4E6F1', borderRadius: 12, padding: 20 },
};
