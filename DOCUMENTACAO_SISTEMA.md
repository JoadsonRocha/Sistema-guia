# 🦅 Documentação Técnica e Arquitetural Completa: Sistema Águia (Nexus Política 2026)

Documentação técnica oficial do **Sistema Águia / Nexus Política**, cobrindo arquitetura, modelo de dados, políticas de segurança RLS, módulos funcionais, inteligência local, segurança de servidor e guias de implantação.

---

## 📌 1. Visão Geral do Sistema

O **Sistema Águia (Nexus Política 2026)** é uma plataforma integrada de **CRM Eleitoral, Inteligência de Campo, Gestão Financeira (Caixa Forte), Logística de Insumos e Mapeamento Geográfico TRE**, projetada especificamente para campanhas eleitorais de alta performance no estado de Roraima (com suporte a Boa Vista e municípios do interior).

### Principais Diferenciais:
- **Blindagem Multi-Tenant RLS:** Isolamento total de dados no banco PostgreSQL Supabase. Líderes de campo enxergam apenas seus próprios eleitores; transações financeiras são restritas à coordenação.
- **Inteligência de Campo ("Organizador de Caos"):** Algoritmos determinísticos locais que transformam anotações brutas e relatos de áudio em tarefas logísticas, ações políticas, alertas de crise e briefings contextualizados para o candidato.
- **Offline-First:** Suporte a cadastro de eleitores e operações de campo mesmo sem conexão com a internet, com sincronização automática via buffer local.
- **Mapeamento TRE & Geolocalização:** Mapeamento de zonas e seções eleitorais de Roraima, com suporte a geolocalização dos eleitores e check-in de campo.
- **Disparo Direto via WhatsApp:** Envio individual ou em lote de mensagens personalizadas para eleitores e lideranças.

---

## 💻 2. Stack Tecnológica

### Frontend:
- **Framework:** React 19 + TypeScript (ESModules / Vite 6)
- **Estilização:** Tailwind CSS v4 + Dark/Light Theme System
- **Animações e Ícones:** Motion (Framer Motion) + Lucide React
- **Gráficos e Mapas:** Recharts + D3.js + Roraima Geomap Custom Component
- **Exportação de Dados:** `docx` (Word), `jspdf` / `jspdf-autotable` (PDF), `xlsx` (Excel)

### Backend & API Server:
- **Ambiente de Execução:** Node.js 20.x + Express 4
- **Compilação e Dev:** `tsx` em desenvolvimento / `esbuild` para bundle Node CJS em produção (`dist/server.cjs`)
- **Monitoramento e Telemetria:** Sentry Node SDK (`@sentry/node`)
- **Headers & Hardening:** CSP estrita (dev vs prod), CORS dinâmico por whitelist, proteção contra Path Traversal e limitação de payload (2MB)

### Banco de Dados & Autenticação:
- **Provider:** Supabase (PostgreSQL 15+)
- **Autenticação:** Supabase Auth (JWT com auto-criação de perfil via Triggers)
- **Persistência Local / Fallback:** `safeLocalStorage` e `eleitoralStorage` para suporte Offline-First

---

## 🔒 3. Hierarquia de Atores e Matriz de Permissões

O sistema opera com controle rígido de acesso baseado em funções (*Role-Based Access Control - RBAC*):

| Ator | Tipo no Banco (`user_role`) | Visibilidade de Dados | Funcionalidades Principais |
| :--- | :--- | :--- | :--- |
| **Administrador Master** | `admin` | Acesso Total (Read/Write) | Controle total do sistema, auditoria, bypass administrativo |
| **Coordenador Geral / Regional** | `coordenador_geral`, `coordenador_regional`, `coordenador` | Todos os dados da coordenação | Gestão financeiro-orçamentária, aprovação de urgências/combustível, gestão de equipes, briefing IA, relatórios executivos |
| **Líder de Equipe / Cabo Eleitoral** | `lider` | Apenas dados inseridos pelo próprio usuário | Cadastro de eleitores CRM, solicitação de combustível/urgência, solicitação de materiais, check-in georreferenciado |
| **Público Externo** | Autocadastro sem login (`/cadastro`) | Sem acesso a dados existentes | Cadastro de eleitores vinculados dinamicamente a um Líder ou Equipe via parâmetro URL (`?leaderId=...`) |
| **Modo Demonstração** | `demoRole` (`coordenador_geral` ou `lider`) | Dados simulados em memória | Apresentação comercial do sistema com modais restritivos para conversão de vendas |

---

## 🗄️ 4. Arquitetura do Banco de Dados (Supabase PostgreSQL)

### 4.1 Tipos Enumerados (`ENUM`)
- `public.user_role`: `'admin'`, `'coordenador_geral'`, `'coordenador_regional'`, `'lider'`, `'coordenador'`
- `public.sentiment_type`: `'Apoiador'`, `'Neutro'`, `'Oposição'`
- `public.urgency_status`: `'pendente'`, `'aprovado'`, `'negado'`
- `public.transaction_type`: `'RECEITA'`, `'DESPESA'`, `'COTA'`

### 4.2 Estrutura das Tabelas Principais

1. **`public.profiles`**: Perfis de usuário estendidos a partir de `auth.users`.
   - Campos: `id` (FK auth.users), `email`, `full_name`, `role`, `region`, `coordinator_id`, `team_id`, `force_password_change`.
2. **`public.campaigns`**: Campanhas isoladas para multi-tenancy.
   - Campos: `id`, `name`, `candidate_name`, `candidate_title`, `photo_url`.
3. **`public.teams`**: Equipes regionais com controle de orçamento e cotas.
   - Campos: `id`, `coordinator_id`, `name`, `leader_id`, `region`, `allocated_budget`, `spent_budget`.
4. **`public.voters`**: CRM Eleitoral e Rede de Influência (dados sensíveis do eleitor).
   - Campos: `id`, `coordinator_id`, `leader_id`, `name`, `phone`, `address`, `bairro`, `municipio`, `zona`, `secao`, `sentiment`, `indicated_by` (árvore de indicação), `is_indigenous`, `photo_url`, `geo_lat`, `geo_lng`.
5. **`public.urgencies`**: Solicitações de emergência e liberação de combustível.
   - Campos: `id`, `coordinator_id`, `team_id`, `leader_id`, `title`, `amount`, `status`, `description`, `response_note`.
6. **`public.transactions`**: Gestão financeira central e Caixa Forte (Sigilo Financeiro).
   - Campos: `id`, `coordinator_id`, `team_id`, `type`, `amount`, `category`, `description`, `receipt_url`, `signed_by`.
7. **`public.agenda_events`**: Compromissos e agenda do candidato.
   - Campos: `id`, `coordinator_id`, `title`, `location`, `municipality`, `event_date`, `conflict_warning`, `status`.
8. **`public.notes`**: Anotações táticas de campo do coordenador.
   - Campos: `id`, `coordinator_id`, `author_id`, `title`, `content`, `tags`, `is_private`.
9. **`public.materials` & `public.material_requests`**: Controle de estoque de santinhos/bandeiras e pedidos das equipes.
10. **`public.tre_locations`**: Locais de votação e contingente de eleitores por zona/seção em Roraima.
11. **`public.campaign_records` & `public.coordinator_campaigns`**: Registro consolidado e chave-valor para sincronização do estado da campanha.

---

## 🛡️ 5. Políticas de Segurança em Nível de Linha (Row Level Security - RLS)

Todas as tabelas possuem RLS ativado com regras restritivas:

- **Isolamento de Eleitores (`public.voters`):**
  - Líderes só leem, editam ou excluem eleitores onde `leader_id = auth.uid()`.
  - Coordenadores e Admins leem todos os eleitores sob sua coordenação (`coordinator_id = get_my_coordinator_id()`).
- **Sigilo Financeiro (`public.transactions`):**
  - Acesso restrito exclusivamente a usuários com função de `admin` ou `coordenador` (`public.is_admin_or_coordinator()`). Líderes de campo não têm permissão de leitura ou escrita no caixa geral.
- **Urgências e Combustível (`public.urgencies`):**
  - Líderes podem criar e visualizar suas próprias solicitações.
  - Somente coordenadores e admins podem alterar o status (`aprovado` / `negado`) e definir `response_note`.
- **Perfis de Usuário (`public.profiles`):**
  - Leitura permitida para o próprio usuário, coordenador da equipe ou admins.

---

## 🧩 6. Blocos Funcionais e Módulos do Sistema

### 🧠 Bloco A: Inteligência Estratégica & Organizador de Caos
- **Filtro Determinístico Local:** Processa relatos brutos em texto ou transcrição de áudio, dividindo o conteúdo em:
  - Tarefas Logísticas (verba, transporte, compras, combustível)
  - Ações Políticas (reuniões, lideranças comunitárias, Tuxauas, alianças)
  - Alertas de Crise (denúncias, estradas vicinais intransitáveis, problemas comunitários)
  - Sugestões de Agenda (identificação automática dos 15 municípios de Roraima)
- **Gerador de Briefing para o Candidato:** Produz orientações personalizadas por município (Pacaraima, Uiramutã, Cantá, Rorainópolis, Bonfim, Amajari, etc.), apontando pautas prioritárias, temas a evitar no discurso e o tom de voz ideal.

### 👥 Bloco B: CRM Eleitoral & Cadastro de Campo
- **Formulário de Cadastro:** Registro rápido de eleitores com telefone, endereço, zona/seção eleitoral, sentimento (Apoiador/Neutro/Oposição), foto e geolocalização.
- **Árvore de Influência:** Vinculação de eleitor indicante (`indicated_by`) para rastrear redes de contatos e multiplicação de votos.
- **Modo Indígena / Comunidades:** Marcador para atendimento a populações indígenas e lideranças tradicionais (Tuxauas/Malocas).

### 💳 Bloco C: Caixa Forte & Orçamento de Campanha
- **Gestão de Transações:** Registro de Receitas, Despesas e Cotas com upload de comprovantes.
- **Fatiamento de Cotas:** Alocação de verbas do caixa central para carteiras de equipes regionais.
- **Monitor de Gastos:** Acompanhamento de orçamento alocado (`allocated_budget`) vs gasto (`spent_budget`).

### 🚚 Bloco D: Logística, Urgências & Estoque de Materiais
- **Solicitações de Emergência:** Pedidos de combustível e verba urgente com triagem e notificação para a coordenação.
- **Controle de Material:** Gestão do estoque de panfletos, adesivos e santinhos, com controle de pedidos por equipe regional.

### 📍 Bloco E: Mapeamento TRE & Análise Territorial Roraima
- **Visualizador Territorial:** Gráficos interativos e estatísticas com totalizador por município e bairro.
- **Tabela TRE:** Consulta de zonas e seções eleitorais de Roraima para direcionar a alocação de fiscais e cabos eleitorais.

---

## ⚡ 7. Servidor backend & Hardening (`server.ts`)

- **Vite Integration Middleware:** Em ambiente de desenvolvimento, o Express utiliza o Vite como middleware SPA. Em produção, serve os arquivos estáticos de `dist/`.
- **Injeção de Metadados Open Graph (WhatsApp Preview):** Intercepta requisições HTML (`text/html`) e injeta as tags Open Graph com o nome, título e foto do candidato para pré-visualizações ricas ao compartilhar links de cadastro via WhatsApp.
- **Sanitização contra Path Traversal:** Rota `/download/arquitetura-doc` valida rigorosamente o caminho de arquivo no diretório `public/` impedindo acessos não autorizados.
- **Cabeçalhos de Segurança:**
  - `Content-Security-Policy`: Restritiva em produção, liberando scripts/estilos apenas das origens autorizadas.
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Permissions-Policy`
  - Controladores CORS rigorosos por whitelist (`ALLOWED_ORIGINS`).

---

## 📦 8. Implantação & Configuração (Railway / Supabase)

### Variáveis de Ambiente Requeridas (`.env` / Railway):

| Variável | Descrição | Exemplo / Padrão |
| :--- | :--- | :--- |
| `PORT` | Porta de execução do servidor Express | `3000` |
| `NODE_ENV` | Ambiente de execução | `production` / `development` |
| `VITE_SUPABASE_URL` | URL do projeto Supabase | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Chave pública anônima do Supabase | `eyJhbG...` |
| `ALLOWED_ORIGINS` | Origens autorizadas para CORS (separadas por vírgula) | `https://www.nexuspolitica.com.br,http://localhost:3000` |
| `SENTRY_DSN` | (Opcional) DSN para rastreamento de erros | `https://xxx@sentry.io/yyy` |
| `MAX_BODY_SIZE` | Limite de payload HTTP | `2mb` |

### Scripts de Build e Execução (`package.json`):
```bash
# Desenvolvimento local
npm run dev

# Verificação de tipos TypeScript
npm run lint

# Build para produção (Vite + esbuild CJS server)
npm run build

# Inicialização em Produção
npm run start
```

---

## 📄 9. Estrutura de Arquivos Principais

```
Sistema-guia/
├── server.ts                  # Servidor Express, Segurança HTTP, Middleware Vite & OG Meta
├── schema.sql                 # DDL PostgreSQL Supabase (Tabelas, Enums, RLS e Triggers)
├── package.json               # Dependências do projeto e scripts de build
├── vite.config.ts             # Configuração de build e plugins Vite
├── public/                    # Documentos públicos e assets estáticos
└── src/
    ├── App.tsx                # Roteamento React Router (Público, Protegido e Landings)
    ├── main.tsx               # Ponto de entrada React com SupabaseProvider
    ├── pages/
    │   ├── DashboardPage.tsx  # Alternador de Dashboard por perfil (Coord / Cabo)
    │   ├── LoginPage.tsx      # Autenticação e suporte a parâmetros de Demo
    │   └── ForcePasswordChangePage.tsx # Alteração obrigatória de senha inicial
    ├── components/
    │   ├── CoordinatorDashboard.tsx  # Painel do Coordenador (Inteligência, Finanças, TRE)
    │   ├── CaboDashboard.tsx         # Painel do Líder de Campo (Cadastro, Urgências)
    │   ├── PublicVoterRegister.tsx   # Formulário público de cadastro de eleitores
    │   ├── SalesLandingPage.tsx      # Landing page de vendas e demonstração comercial
    │   ├── RoraimaMapComponent.tsx   # Componente de mapa interativo de Roraima
    │   ├── WhatsAppDispatchModal.tsx # Modal de disparos para WhatsApp
    │   └── TreLocationFields.tsx     # Seleção e consulta de seções do TRE
    ├── services/
    │   ├── geminiService.ts   # Algoritmo determinístico local ("Organizador do Caos")
    │   ├── whatsappService.ts # Utilitário para envio de mensagens WhatsApp
    │   └── reportService.ts   # Exportação de relatórios em PDF, DOCX e Excel
    └── lib/
        ├── supabase.ts        # Cliente Supabase JS
        ├── supabaseService.ts # Serviços de dados e queries Supabase
        ├── SupabaseProvider.tsx # Contexto global de autenticação e estado
        └── eleitoralStorage.ts# Buffer offline e sincronização local
```
