// ─── User ───
export interface User {
  id: string;
  email: string;
  role: 'partner' | 'admin';
  nome: string;
  onboardingStep: 'pending_activation' | 'company_data' | 'contract' | 'active';
  contractSignedAt?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  password: string;
}

// ─── Company ───
export interface Company {
  _id?: string;
  userId: string;
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  representante: {
    nome: string;
    cpf: string;
    cargo: string;
  };
  dataContrato?: string;
  localAssinatura?: string;
  isComplete: boolean;
}

// ─── Auxiliary Data ───
export interface AuxiliaryData {
  responsavel: {
    nome: string;
    telefone: string;
    email: string;
    aniversario: string;
  };
  pagamento: {
    tipo: 'banco' | 'pix';
    banco: string;
    agencia: string;
    conta: string;
    chavePix: string;
  };
  testemunha: {
    nome: string;
    cpf: string;
    email: string;
  };
}

// ─── Indication ───
export interface Indication {
  _id?: string;
  partnerId: string;
  nomeEmpresa: string;
  cnpj: string;
  segmento: string;
  site: string;
  nomeContato: string;
  emailContato: string;
  telefoneContato: string;
  status: 'nova' | 'em_negociacao' | 'sucesso' | 'insucesso' | 'pausada';
  statusHistory?: StatusChange[];
  observacaoAdmin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StatusChange {
  status: string;
  changedBy: string;
  changedAt: string;
  observacao: string;
}

export interface IndicationListResponse {
  indications: Indication[];
  total: number;
  page: number;
  totalPages: number;
  stats: Record<string, number>;
}

// ─── Admin Dashboard ───
export interface DashboardData {
  totalPartners: number;
  activePartners: number;
  totalIndications: number;
  statusBreakdown: Record<string, number>;
  recentIndications: Indication[];
  monthlyIndications: { _id: { year: number; month: number }; count: number }[];
}

// Status labels for display
export const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  nova: { label: 'Nova', color: '#1B5E8C', bg: '#EAF2F8' },
  em_negociacao: { label: 'Em Negociação', color: '#F39C12', bg: '#FEF3E2' },
  sucesso: { label: 'Sucesso', color: '#27AE60', bg: '#E8F8EF' },
  insucesso: { label: 'Insucesso', color: '#C0392B', bg: '#FDEDEC' },
  pausada: { label: 'Pausada', color: '#7F8C8D', bg: '#F2F3F4' }
};

export const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

export const SEGMENTOS = [
  'Saúde / Clínicas','Cooperativas de Crédito','E-commerce','Cartórios',
  'Contabilidade','Educação','Imobiliárias','Varejo','Tecnologia',
  'Serviços Financeiros','Indústria','Logística','Outro'
];
