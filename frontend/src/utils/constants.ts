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
