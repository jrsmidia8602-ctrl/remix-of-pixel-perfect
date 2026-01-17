# XPEX Neural OS

> 🧠 Plataforma de Agentes Autônomos com Orquestração Inteligente e Economia de Agentes

[![Deploy Status](https://img.shields.io/badge/deploy-production-brightgreen)](https://exact-frame-vision.lovable.app)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

## 📋 Visão Geral

XPEX Neural OS é uma plataforma completa para gerenciamento de agentes autônomos que executam tarefas de monetização de APIs, pagamentos automatizados e yield farming em tempo real.

### 🎯 Recursos Principais

- **Neural Brain**: Orquestração central de agentes autônomos
- **Real-time Monitoring**: Dashboard com métricas ao vivo via Supabase Realtime
- **Revenue Heatmap**: Visualização de padrões de receita por hora/dia
- **Agent Performance**: Rankings e métricas de performance por agente
- **CRON Automation**: Execuções automáticas a cada 5 minutos
- **Stripe Integration**: Pagamentos e webhooks integrados
- **Web3 Support**: Yield farming e transações blockchain

## 🛠️ Stack Tecnológica

| Tecnologia | Uso |
|------------|-----|
| **React 18** | Framework frontend |
| **TypeScript** | Tipagem estática |
| **Vite** | Build tool |
| **Tailwind CSS** | Estilização |
| **shadcn/ui** | Componentes UI |
| **Supabase** | Backend & Realtime |
| **Stripe** | Pagamentos |
| **Recharts** | Gráficos e visualizações |
| **wagmi/viem** | Web3 integration |

## 🚀 Deploy

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Supabase (configurada via Lovable Cloud)
- Conta Stripe (para pagamentos)

### Variáveis de Ambiente

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NODE_ENV=production
```

### Instalação Local

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/xpex-neural.git

# Navegue para o diretório
cd xpex-neural

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### Deploy em Produção

#### Opção 1: Lovable (Recomendado)

1. Acesse [Lovable](https://lovable.dev)
2. Abra o projeto
3. Clique em **Share → Publish**

#### Opção 2: Vercel

```bash
# Instale o Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## ⚡ CRON Jobs

O sistema utiliza um CRON job externo para execuções automáticas:

| Job | Schedule | Endpoint |
|-----|----------|----------|
| Agent Scheduler | `*/5 * * * *` | `/functions/v1/agent-scheduler` |

### Configuração do CRON

1. Acesse [cron-job.org](https://cron-job.org) ou similar
2. Configure a URL: `https://ggzdhmltktbcpuwgvljn.supabase.co/functions/v1/agent-scheduler`
3. Método: `POST`
4. Body: `{"action": "run_scheduled_cycle"}`
5. Schedule: A cada 5 minutos

## 🔗 Stripe Webhooks

Configure o webhook no Stripe Dashboard:

- **URL**: `https://ggzdhmltktbcpuwgvljn.supabase.co/functions/v1/stripe-webhook`
- **Eventos**:
  - `payment_intent.succeeded`
  - `payment_intent.failed`
  - `charge.succeeded`
  - `charge.failed`

## 📊 Módulos do Sistema

| Módulo | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/` | Visão geral de métricas e receita |
| Neural Brain | `/neural-brain` | Orquestração de agentes |
| System Audit | `/system-audit` | Auditoria e diagnósticos |
| Control Center | `/control` | Gestão de CRON e webhooks |
| Phoenix | `/phoenix` | Execuções manuais |
| Payments | `/payments` | Gestão Stripe Connect |
| Web3 | `/web3` | Blockchain e yield |

## 🏗️ Arquitetura

```
src/
├── components/
│   ├── audit/          # Painéis de auditoria
│   ├── control/        # Controles operacionais
│   ├── dashboard/      # Componentes do dashboard
│   ├── layout/         # Layout e navegação
│   ├── neural/         # Componentes do Neural Brain
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
├── pages/              # Páginas da aplicação
├── integrations/       # Integrações (Supabase)
└── lib/                # Utilitários

supabase/
└── functions/          # Edge Functions
    ├── agent-scheduler/
    ├── neural-brain/
    ├── stripe-webhook/
    └── ...
```

## 📈 Escalabilidade

| Métrica | Target |
|---------|--------|
| Agentes | 100+ |
| Revenue/Agente | $0.05 |
| MRR Target | $5,000+/mês |

## 🔒 Segurança

- ✅ API Keys em secure storage
- ✅ JWT verification
- ✅ Rate limiting
- ✅ RLS policies no Supabase
- ✅ Webhooks assinados

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

<p align="center">
  Built with ❤️ using <a href="https://lovable.dev">Lovable</a>
</p>
