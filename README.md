# Portal de Parceiros v2.0 — Mais Chat Tecnologia

## Arquitetura

```
Frontend (Angular 18) ──HTTP──► Backend (Node/Express) ──► MongoDB
                                    ├── SMTP (Nodemailer)
                                    ├── D4Sign API + Webhook
                                    ├── Cron: Comissões (dia 16)
                                    ├── Cron: Inatividade (diário)
                                    └── API Externa (X-API-Key)
```

## Segurança (v2)
- Helmet (headers de segurança)
- Rate limiting: geral (100/15min), auth (20/15min), API externa (60/min)
- Validação CNPJ/CPF com dígitos verificadores (backend)
- JWT com chave forte (64+ chars)
- API Key com rotação (primary/secondary) e expiração
- Webhook D4Sign com secret validation

## Setup

```bash
cd backend
cp .env.example .env    # Editar credenciais
npm install
npm run seed            # Cria admin master
npm run dev             # Porta 3000
```

```bash
cd frontend
npm install
ng serve                # Porta 4200
```

## Fluxo Completo

### Parceiro
1. Cadastro → Email ativação → Ativa conta
2. Dados empresa (CNPJ validado) + Auxiliares + Testemunha
3. Contrato → D4Sign (3 signatários) → Webhook auto-ativa
4. Dashboard (projeção de ganhos) → Indicações → Relatórios/NFe

### Admin
1. Dashboard (métricas + financeiro + pendências validação)
2. Validar/Rejeitar indicações (parceiro recebe email)
3. Indicações: status, cliente, valor parcela, comissão %, pagamentos, anexos
4. Parceiros: volume, faturado, comissão, detalhe
5. Comissões: ciclos 16→15, relatórios, NFe, comprovante
6. Churn report: clientes que saíram + impacto financeiro

## APIs

### Auth `/api/auth`
POST /register | GET /activate/:token | POST /login | GET /me

### Partner `/api/partner`
GET /profile | POST /company | PUT /auxiliary-data | GET /earnings-projection

### Indication `/api/indication`
POST / | GET / | GET /:id | GET /commission/cycles | GET /commission/cycle/:id | POST /commission/cycle/:id/nfe

### Admin `/api/admin`
GET /dashboard | GET /partners | GET /partner/:id
GET /indications (filtros: status, partnerId, search, month, year, statusCliente, statusValidacao)
PUT /indication/:id/validate (aceite formal)
PUT /indication/:id/status | PUT /indication/:id/client-status
PUT /indication/:id/valor-parcela | PUT /indication/:id/commission (motivo obrigatório)
POST /indication/:id/payment | POST /indication/:id/attachment
GET /churn-report
GET /commission-cycles | GET /commission-cycle/:id
PUT /commission-cycle/:id/status | POST /commission-cycle/:id/comprovante
POST /commission-calculate | POST /commission-cycle/:id/recalculate

### Webhook `/api/webhook`
POST /d4sign (auto-ativa parceiro quando todos assinam)

### External API `/api/external` (Header: X-API-Key)
GET/POST /indication | GET /indications | POST /indication/:id/payment
PUT /indication/:id/payment/:paymentId | PUT /indication/:id/status
PUT /indication/:id/client-status | GET /partners | GET /commission-cycles
GET /financial-summary

## Cron Jobs
- **Comissões** (node-cron): dia 16 às 06:00 BRT — calcula ciclo 16→15
- **Recovery**: startup verifica ciclos perdidos e recalcula
- **Inatividade** (diário 08:00): aviso 60d, aviso 80d, log 90d+

## Emails Automáticos (10 tipos)
1. Ativação de conta
2. Notificação nova indicação → admin
3. Validação/Rejeição → parceiro
4. Mudança status indicação → parceiro
5. Mudança status cliente → parceiro
6. Pagamento registrado → parceiro (com valor comissão)
7. Cópia contrato PDF → parceiro + admin
8. Alerta inatividade (60d e 80d) → parceiro
9. Cadastro auxiliar → admin
10. Alerta churn → admin

## Status

### Validação: pendente → validada | rejeitada
### Indicação: nova → em_negociacao → sucesso | insucesso | pausada
### Cliente: prospect → ativo → inativo | suspenso
### Ciclo Comissão: calculado → fechado → nfe_pendente → nfe_enviada → pago | cancelado

---
Mais Chat Tecnologia LTDA — CNPJ 45.741.564/0001-13
