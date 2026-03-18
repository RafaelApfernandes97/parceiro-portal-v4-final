import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { maskCNPJ, maskCPF, maskCEP, maskTel } from '../utils/masks';
import { ESTADOS_BR } from '../utils/constants';

interface CompanyData {
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  representanteNome: string;
  representanteCpf: string;
  representanteCargo: string;
  localAssinatura: string;
  dataContrato: string;
}

interface AuxData {
  responsavelNome: string;
  responsavelTelefone: string;
  responsavelEmail: string;
  responsavelAniversario: string;
  pagamentoTipo: 'banco' | 'pix';
  banco: string;
  agencia: string;
  conta: string;
  tipoConta: string;
  pixTipo: string;
  pixChave: string;
  testemunhaNome: string;
  testemunhaCpf: string;
  testemunhaEmail: string;
}

const emptyCompany: CompanyData = {
  razaoSocial: '', cnpj: '', inscricaoEstadual: '', endereco: '', cidade: '', estado: '', cep: '',
  representanteNome: '', representanteCpf: '', representanteCargo: '', localAssinatura: '', dataContrato: '',
};

const emptyAux: AuxData = {
  responsavelNome: '', responsavelTelefone: '', responsavelEmail: '', responsavelAniversario: '',
  pagamentoTipo: 'pix', banco: '', agencia: '', conta: '', tipoConta: 'corrente',
  pixTipo: 'cpf', pixChave: '',
  testemunhaNome: '', testemunhaCpf: '', testemunhaEmail: '',
};

export default function CompanyProfile() {
  const { updateLocalUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [company, setCompany] = useState<CompanyData>({ ...emptyCompany });
  const [aux, setAux] = useState<AuxData>({ ...emptyAux });
  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/partner/profile').then(res => {
      const p = res.data;
      if (p.razaoSocial) {
        setCompany({
          razaoSocial: p.razaoSocial || '',
          cnpj: p.cnpj ? maskCNPJ(p.cnpj) : '',
          inscricaoEstadual: p.inscricaoEstadual || '',
          endereco: p.endereco || '',
          cidade: p.cidade || '',
          estado: p.estado || '',
          cep: p.cep ? maskCEP(p.cep) : '',
          representanteNome: p.representante?.nome || '',
          representanteCpf: p.representante?.cpf ? maskCPF(p.representante.cpf) : '',
          representanteCargo: p.representante?.cargo || '',
          localAssinatura: p.localAssinatura || '',
          dataContrato: p.dataContrato ? p.dataContrato.substring(0, 10) : '',
        });
      }
      if (p.responsavel) {
        setAux({
          responsavelNome: p.responsavel?.nome || '',
          responsavelTelefone: p.responsavel?.telefone ? maskTel(p.responsavel.telefone) : '',
          responsavelEmail: p.responsavel?.email || '',
          responsavelAniversario: p.responsavel?.aniversario ? p.responsavel.aniversario.substring(0, 10) : '',
          pagamentoTipo: p.pagamento?.tipo || 'pix',
          banco: p.pagamento?.banco || '',
          agencia: p.pagamento?.agencia || '',
          conta: p.pagamento?.conta || '',
          tipoConta: p.pagamento?.tipoConta || 'corrente',
          pixTipo: p.pagamento?.pixTipo || 'cpf',
          pixChave: p.pagamento?.pixChave || '',
          testemunhaNome: p.testemunha?.nome || '',
          testemunhaCpf: p.testemunha?.cpf ? maskCPF(p.testemunha.cpf) : '',
          testemunhaEmail: p.testemunha?.email || '',
        });
      }
    }).catch(() => {}).finally(() => setLoadingPage(false));
  }, []);

  function setC(field: keyof CompanyData, value: string) {
    setCompany(prev => ({ ...prev, [field]: value }));
  }

  function setA(field: keyof AuxData, value: string) {
    setAux(prev => ({ ...prev, [field]: value }));
  }

  async function handleStep1(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!company.razaoSocial || !company.cnpj || !company.endereco || !company.cidade || !company.estado || !company.cep) {
      setError('Preencha todos os campos obrigatórios da empresa.');
      return;
    }
    if (!company.representanteNome || !company.representanteCpf || !company.representanteCargo) {
      setError('Preencha os dados do representante legal.');
      return;
    }
    if (!company.localAssinatura || !company.dataContrato) {
      setError('Preencha o local e data do contrato.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/partner/company', {
        razaoSocial: company.razaoSocial,
        cnpj: company.cnpj.replace(/\D/g, ''),
        inscricaoEstadual: company.inscricaoEstadual,
        endereco: company.endereco,
        cidade: company.cidade,
        estado: company.estado,
        cep: company.cep.replace(/\D/g, ''),
        representante: {
          nome: company.representanteNome,
          cpf: company.representanteCpf.replace(/\D/g, ''),
          cargo: company.representanteCargo,
        },
        localAssinatura: company.localAssinatura,
        dataContrato: company.dataContrato,
      });
      setStep(2);
      window.scrollTo(0, 0);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar dados da empresa.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!aux.responsavelNome || !aux.responsavelTelefone || !aux.responsavelEmail) {
      setError('Preencha os dados do responsável.');
      return;
    }
    if (!aux.testemunhaNome || !aux.testemunhaCpf || !aux.testemunhaEmail) {
      setError('Preencha os dados da testemunha.');
      return;
    }
    setLoading(true);
    try {
      const pagamento: any = { tipo: aux.pagamentoTipo };
      if (aux.pagamentoTipo === 'banco') {
        pagamento.banco = aux.banco;
        pagamento.agencia = aux.agencia;
        pagamento.conta = aux.conta;
        pagamento.tipoConta = aux.tipoConta;
      } else {
        pagamento.pixTipo = aux.pixTipo;
        pagamento.pixChave = aux.pixChave;
      }
      await api.put('/partner/auxiliary-data', {
        responsavel: {
          nome: aux.responsavelNome,
          telefone: aux.responsavelTelefone.replace(/\D/g, ''),
          email: aux.responsavelEmail,
          aniversario: aux.responsavelAniversario || undefined,
        },
        pagamento,
        testemunha: {
          nome: aux.testemunhaNome,
          cpf: aux.testemunhaCpf.replace(/\D/g, ''),
          email: aux.testemunhaEmail,
        },
      });
      updateLocalUser({ onboardingStep: 'contract' });
      navigate('/contract');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar dados auxiliares.');
    } finally {
      setLoading(false);
    }
  }

  if (loadingPage) {
    return (
      <div style={styles.wrap}>
        <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Carregando...</div>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <h1 style={styles.h1}>Cadastro da Empresa</h1>
      <p style={styles.sub}>Preencha os dados para gerar seu contrato de parceria.</p>

      {/* Step indicators */}
      <div style={styles.steps}>
        <div style={{ ...styles.stepItem, ...(step >= 1 ? styles.stepActive : {}) }}>
          <span style={styles.stepNum}>1</span>
          <span>Dados da Empresa</span>
        </div>
        <div style={styles.stepLine} />
        <div style={{ ...styles.stepItem, ...(step >= 2 ? styles.stepActive : {}) }}>
          <span style={styles.stepNum}>2</span>
          <span>Dados Auxiliares</span>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {step === 1 && (
        <form onSubmit={handleStep1}>
          <div style={styles.card}>
            <h2 style={styles.h2}>Dados da Empresa</h2>
            <div style={styles.row}>
              <div style={styles.col}>
                <label style={styles.label}>Razão Social *</label>
                <input style={styles.input} value={company.razaoSocial} onChange={e => setC('razaoSocial', e.target.value)} placeholder="Razão Social da empresa" />
              </div>
              <div style={styles.col}>
                <label style={styles.label}>CNPJ *</label>
                <input style={styles.input} value={company.cnpj} onChange={e => setC('cnpj', maskCNPJ(e.target.value))} placeholder="00.000.000/0000-00" />
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.col}>
                <label style={styles.label}>Inscrição Estadual</label>
                <input style={styles.input} value={company.inscricaoEstadual} onChange={e => setC('inscricaoEstadual', e.target.value)} placeholder="Inscrição Estadual" />
              </div>
            </div>
            <div style={styles.row}>
              <div style={{ flex: 2 }}>
                <label style={styles.label}>Endereço *</label>
                <input style={styles.input} value={company.endereco} onChange={e => setC('endereco', e.target.value)} placeholder="Rua, número, complemento" />
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.col}>
                <label style={styles.label}>Cidade *</label>
                <input style={styles.input} value={company.cidade} onChange={e => setC('cidade', e.target.value)} placeholder="Cidade" />
              </div>
              <div style={styles.col}>
                <label style={styles.label}>Estado *</label>
                <select style={styles.input} value={company.estado} onChange={e => setC('estado', e.target.value)}>
                  <option value="">Selecione</option>
                  {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
              <div style={styles.col}>
                <label style={styles.label}>CEP *</label>
                <input style={styles.input} value={company.cep} onChange={e => setC('cep', maskCEP(e.target.value))} placeholder="00000-000" />
              </div>
            </div>
          </div>

          <div style={{ ...styles.card, marginTop: 20 }}>
            <h2 style={styles.h2}>Representante Legal</h2>
            <div style={styles.row}>
              <div style={styles.col}>
                <label style={styles.label}>Nome *</label>
                <input style={styles.input} value={company.representanteNome} onChange={e => setC('representanteNome', e.target.value)} placeholder="Nome completo" />
              </div>
              <div style={styles.col}>
                <label style={styles.label}>CPF *</label>
                <input style={styles.input} value={company.representanteCpf} onChange={e => setC('representanteCpf', maskCPF(e.target.value))} placeholder="000.000.000-00" />
              </div>
              <div style={styles.col}>
                <label style={styles.label}>Cargo *</label>
                <input style={styles.input} value={company.representanteCargo} onChange={e => setC('representanteCargo', e.target.value)} placeholder="Ex: Diretor" />
              </div>
            </div>
          </div>

          <div style={{ ...styles.card, marginTop: 20 }}>
            <h2 style={styles.h2}>Local e Data do Contrato</h2>
            <div style={styles.row}>
              <div style={styles.col}>
                <label style={styles.label}>Local de Assinatura *</label>
                <input style={styles.input} value={company.localAssinatura} onChange={e => setC('localAssinatura', e.target.value)} placeholder="Ex: São Paulo - SP" />
              </div>
              <div style={styles.col}>
                <label style={styles.label}>Data do Contrato *</label>
                <input style={styles.input} type="date" value={company.dataContrato} onChange={e => setC('dataContrato', e.target.value)} />
              </div>
            </div>
          </div>

          <div style={styles.btnRow}>
            <button type="submit" disabled={loading} style={styles.btn}>
              {loading ? 'Salvando...' : 'Próximo: Dados Auxiliares'}
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2}>
          <div style={styles.card}>
            <h2 style={styles.h2}>Responsável pelo Contato</h2>
            <div style={styles.row}>
              <div style={styles.col}>
                <label style={styles.label}>Nome *</label>
                <input style={styles.input} value={aux.responsavelNome} onChange={e => setA('responsavelNome', e.target.value)} placeholder="Nome do responsável" />
              </div>
              <div style={styles.col}>
                <label style={styles.label}>Telefone *</label>
                <input style={styles.input} value={aux.responsavelTelefone} onChange={e => setA('responsavelTelefone', maskTel(e.target.value))} placeholder="(00) 00000-0000" />
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.col}>
                <label style={styles.label}>E-mail *</label>
                <input style={styles.input} type="email" value={aux.responsavelEmail} onChange={e => setA('responsavelEmail', e.target.value)} placeholder="email@empresa.com" />
              </div>
              <div style={styles.col}>
                <label style={styles.label}>Aniversário</label>
                <input style={styles.input} type="date" value={aux.responsavelAniversario} onChange={e => setA('responsavelAniversario', e.target.value)} />
              </div>
            </div>
          </div>

          <div style={{ ...styles.card, marginTop: 20 }}>
            <h2 style={styles.h2}>Dados de Pagamento</h2>
            <div style={styles.row}>
              <div style={styles.col}>
                <label style={styles.label}>Tipo de Pagamento</label>
                <div style={styles.toggleWrap}>
                  <button type="button" style={{ ...styles.toggleBtn, ...(aux.pagamentoTipo === 'banco' ? styles.toggleActive : {}) }} onClick={() => setA('pagamentoTipo', 'banco')}>
                    Conta Bancária
                  </button>
                  <button type="button" style={{ ...styles.toggleBtn, ...(aux.pagamentoTipo === 'pix' ? styles.toggleActive : {}) }} onClick={() => setA('pagamentoTipo', 'pix')}>
                    PIX
                  </button>
                </div>
              </div>
            </div>
            {aux.pagamentoTipo === 'banco' && (
              <>
                <div style={styles.row}>
                  <div style={styles.col}>
                    <label style={styles.label}>Banco</label>
                    <input style={styles.input} value={aux.banco} onChange={e => setA('banco', e.target.value)} placeholder="Nome do banco" />
                  </div>
                  <div style={styles.col}>
                    <label style={styles.label}>Agência</label>
                    <input style={styles.input} value={aux.agencia} onChange={e => setA('agencia', e.target.value)} placeholder="0000" />
                  </div>
                </div>
                <div style={styles.row}>
                  <div style={styles.col}>
                    <label style={styles.label}>Conta</label>
                    <input style={styles.input} value={aux.conta} onChange={e => setA('conta', e.target.value)} placeholder="00000-0" />
                  </div>
                  <div style={styles.col}>
                    <label style={styles.label}>Tipo de Conta</label>
                    <select style={styles.input} value={aux.tipoConta} onChange={e => setA('tipoConta', e.target.value)}>
                      <option value="corrente">Corrente</option>
                      <option value="poupanca">Poupança</option>
                    </select>
                  </div>
                </div>
              </>
            )}
            {aux.pagamentoTipo === 'pix' && (
              <div style={styles.row}>
                <div style={styles.col}>
                  <label style={styles.label}>Tipo da Chave PIX</label>
                  <select style={styles.input} value={aux.pixTipo} onChange={e => setA('pixTipo', e.target.value)}>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="email">E-mail</option>
                    <option value="telefone">Telefone</option>
                    <option value="aleatoria">Chave Aleatória</option>
                  </select>
                </div>
                <div style={styles.col}>
                  <label style={styles.label}>Chave PIX</label>
                  <input style={styles.input} value={aux.pixChave} onChange={e => setA('pixChave', e.target.value)} placeholder="Sua chave PIX" />
                </div>
              </div>
            )}
          </div>

          <div style={{ ...styles.card, marginTop: 20 }}>
            <h2 style={styles.h2}>Testemunha</h2>
            <div style={styles.row}>
              <div style={styles.col}>
                <label style={styles.label}>Nome *</label>
                <input style={styles.input} value={aux.testemunhaNome} onChange={e => setA('testemunhaNome', e.target.value)} placeholder="Nome completo" />
              </div>
              <div style={styles.col}>
                <label style={styles.label}>CPF *</label>
                <input style={styles.input} value={aux.testemunhaCpf} onChange={e => setA('testemunhaCpf', maskCPF(e.target.value))} placeholder="000.000.000-00" />
              </div>
              <div style={styles.col}>
                <label style={styles.label}>E-mail *</label>
                <input style={styles.input} type="email" value={aux.testemunhaEmail} onChange={e => setA('testemunhaEmail', e.target.value)} placeholder="email@exemplo.com" />
              </div>
            </div>
          </div>

          <div style={styles.btnRow}>
            <button type="button" style={styles.btnOutline} onClick={() => { setStep(1); setError(''); window.scrollTo(0, 0); }}>
              Voltar
            </button>
            <button type="submit" disabled={loading} style={styles.btn}>
              {loading ? 'Salvando...' : 'Salvar e Ir para Contrato'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 800, margin: '0 auto', padding: '32px 24px 80px' },
  h1: { fontSize: 24, color: '#1B5E8C', margin: 0 },
  sub: { color: '#666', margin: '4px 0 24px' },
  steps: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  stepItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, background: '#F2F3F4', color: '#888', fontSize: 14, fontWeight: 600 },
  stepActive: { background: '#EAF2F8', color: '#1B5E8C' },
  stepNum: { width: 28, height: 28, borderRadius: '50%', background: '#D8DEE4', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 },
  stepLine: { flex: 1, height: 2, background: '#D8DEE4' },
  card: { background: '#fff', border: '1px solid #D8DEE4', borderRadius: 12, padding: 24 },
  h2: { fontSize: 16, color: '#1B5E8C', margin: '0 0 16px', paddingBottom: 12, borderBottom: '1px solid #F2F3F4' },
  row: { display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' as const },
  col: { flex: 1, minWidth: 200 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#5A6672', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', border: '1.5px solid #D8DEE4', borderRadius: 8, fontSize: 14, background: '#F7F9FB', boxSizing: 'border-box' as const },
  btnRow: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  btn: { padding: '12px 32px', background: '#1B5E8C', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  btnOutline: { padding: '12px 32px', background: '#fff', color: '#1B5E8C', border: '2px solid #1B5E8C', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  error: { background: '#FDEDEC', color: '#C0392B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 },
  toggleWrap: { display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1.5px solid #D8DEE4' },
  toggleBtn: { flex: 1, padding: '10px 16px', border: 'none', background: '#F7F9FB', fontSize: 13, fontWeight: 600, color: '#888', cursor: 'pointer' },
  toggleActive: { background: '#1B5E8C', color: '#fff' },
};
