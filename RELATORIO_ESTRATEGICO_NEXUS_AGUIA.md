# 🦅 RELATÓRIO ESTRATÉGICO DE AUDITORIA & ARQUITETURA
## NEXUS POLÍTICA / SISTEMA ÁGUIA (2026)
> **Análise Técnica de Segurança, Usabilidade, Tecnologias e Roadmap de Melhorias**  
> **Status:** Análise Concluída | **Modificações em Código Fonte:** Nenhuma (Modo Leitura/Auditoria)  
> **Domínio Analisado:** `https://www.nexuspolitica.com.br/`  
> **Repositório Local:** `d:\FULLSTARK\Sistema-guia`

---

## 📋 SUMÁRIO EXECUTIVO

O **Nexus Política / Sistema Águia** é uma solução web de alta relevância estratégica voltada à coordenação eleitoral, inteligência territorial, controle financeiro de campanha e gestão de lideranças de campo (cabos eleitorais). 

Após uma varredura completa no site em produção (`https://www.nexuspolitica.com.br/`) e no código-fonte local (`Sistema-guia`), identificamos um ecossistema com **excelente proposta de valor funcional e riqueza de recursos**, porém apresentando **vulnerabilidades críticas de segurança no banco de dados**, **gargalos de manutenibilidade por arquivos monolíticos** e **oportunidades decisivas de otimização para usabilidade mobile em zonas de sombra de sinal**.

Este documento apresenta o diagnóstico detalhado divididos em eixos estratégicos, seguidos por uma **Proposta de Naming com Foco Político Puro**, **Plano Estratégico de Implementação em 4 Fases** e a **Especificação de Arquitetura Target Enterprise**.

---

## 🏛️ 1. RECOMENDAÇÃO DE NAMING COM FOCO POLÍTICO PURO & URNA

Para campanhas eleitorais, partidos e consultores políticos no Brasil, a marca precisa comunicar **imediatamente** poder eleitoral, conquista de votos, organização de base e vitória nas urnas. Apresentamos 8 nomes com foco político direto:

| # | Nome Sugerido | Conceito & Apelo Político | Slogan Estratégico | Perfil de Aplicação |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **GABINETE DE GUERRA** *(War Room)* | Conceito consagrado no marketing político para o centro de comando de campanha que reage em tempo real. | *"O centro de comando da sua vitória."* | Campanhas de Alto Impacto (Governo, Prefeitura, Senado) |
| **2** | **COMANDO ELEITORAL** | Transmite hierarquia tática, controle absoluto das lideranças de campo e ordem de mobilização. | *"Inteligência de campo e controle total da eleição."* | Coordenação Geral de Campanha e Grandes Coligações |
| **3** | **PLEITO INTELLIGENCE** | *"Pleito"* é o termo jurídico-político oficial para a eleição nas urnas. Passa sofisticação e autoridade. | *"Dados e estratégia para dominar o pleito."* | Consultorias Políticas, Marqueteiros e Analistas |
| **4** | **MANDATO 360** | Conecta diretamente a campanha ao objetivo final: a conquista e a gestão do Mandato Político. | *"Da campanha à gestão do mandato."* | Deputados, Prefeitos e Vereadores (Campanha + Mandato) |
| **5** | **VOTO & BASE** | Termo direto e focado no core da política de rua: cadastrar a base e converter em votos no Dia D. | *"Organize sua base. Garanta cada voto."* | Operações de Campo, Cabos Eleitorais e Mobilização |
| **6** | **PALANQUE DIGITAL** | Remete ao principal símbolo da política brasileira (o palanque), modernizado com tecnologia de ponta. | *"A força da sua militância no ambiente digital."* | Comunicação de Campanha, Redes e Disparo de Lideranças |
| **7** | **URNA CERTA** | Comunica precisão matemática no resultado final. Focado em auditoria de votos e metas por seção. | *"A precisão dos números rumo às urnas."* | Inteligência Geoeleitoral e Fiscalização de Dia D |
| **8** | **SOBERANA POLÍTICA** | Transmite imponência, força política incontestável e domínio territorial completo da base. | *"A plataforma soberana para grandes campanhas."* | Grandes Partidos, Coligações Majoritárias e Governo |

---

## 🛡️ 2. VARREDURA DE SEGURANÇA & CONFORMIDADE LGPD

### 🚨 Vulnerabilidades Críticas Encontradas

#### 2.1 Brecha Grave de Leitura Pública no Firestore (`firestore.rules`)
*   **Diagnóstico:** As regras de segurança atuais no arquivo `firestore.rules` concedem acesso de leitura irrestrito a qualquer visitante anônimo para dados confidenciais:
    ```json
    match /users/{userId} { allow read: if true; }
    match /settings/{settingId} { allow read: if true; }
    match /teams/{teamId} { allow read: if true; }
    match /voters/{voterId} { allow read: if true; allow create: if true; }
    ```
*   **Risco Real:** Qualquer pessoa na internet que inspecione a chave pública do Firebase no bundle JS da `nexuspolitica.com.br` pode realizar consultas REST ou SDK e **extrair toda a base de eleitores, telefones, endereços, redes de influência e dados de lideranças**, configurando vazamento massivo de PII.
*   **Risco de Injeção de Dados:** A regra `allow create: if true;` em `/voters/{voterId}` permite que atacantes injetem milhares de registros falsos (Resource Poisoning) sem qualquer autenticação.

#### 2.2 Ausência de Controle de Acesso Baseado em Funções (RBAC) no Banco
*   **Diagnóstico:** Para as coleções protegidas, a regra utilizada é genérica:
    ```json
    match /transactions/{id} { allow read, write: if isSignedIn(); }
    match /urgencies/{id} { allow read, write: if isSignedIn(); }
    ```
*   **Risco Real:** O controle de permissões (Diferença entre **Administrador**, **Coordenador** e **Líder de Equipe/Cabo**) é feito **apenas na interface React (Client-Side)**. Qualquer usuário autenticado (como um Cabo de Eleitor com conta no sistema) pode disparar requisições diretas para alterar transações financeiras, aprovar seus próprios pedidos de combustível, alterar dados da campanha ou deletar notas estratégicas.

#### 2.3 Riscos de Conformidade com a LGPD (Lei Geral de Proteção de Dados)
*   **Ausência de Criptografia de Campo / Mascaramento:** Dados sensíveis de eleitores (Título de Eleitor, Seção, Zona, foto, geolocalização e sentimento político) são armazenados em texto plano sem mascaramento ou logs de auditoria de consulta.
*   **Falta de Consentimento e Governança de Exclusão:** O cadastro público de eleitor (`PublicVoterRegister.tsx`) não exibe termos explícitos de aceite da LGPD nem política de privacidade configurável.

#### 2.4 Segurança do Servidor Node/Express (`server.ts`)
*   **Falta de Headers de Segurança HTTP:** O servidor não implementa cabeçalhos defensivos como `Content-Security-Policy` (CSP), `X-Frame-Options` (proteção contra Clickjacking), `X-Content-Type-Options` e `Strict-Transport-Security` (HSTS).
*   **Downloads sem Validação Estrita de Caminho:** A rota `/download/arquitetura-doc` utiliza concatenação de caminhos que deve ser rigidamente tratada contra *Path Traversal*.

---

## 🎨 3. VARREDURA DE USABILIDADE & EXPERIÊNCIA DO USUÁRIO (UX/UI)

### 📊 Diagnóstico de Usabilidade

| Elemento | Status Atual | Diagnóstico & Impacto no Usuário |
| :--- | :--- | :--- |
| **Responsividade Mobile** | ⚠️ Parcial | O painel do Cabo (`CaboDashboard.tsx`) possui boa intenção mobile, mas tabelas financeiras e gráficos complexos de D3/Recharts causam rolagem horizontal e overflow em telas de smartphones de 5.5". |
| **Experiência Offline (Campo)** | 🟡 Intermediário | O Firestore IndexedDB está habilitado em `firebase.ts`, mas a interface **não exibe feedback visual claro** quando o cabo entra em zona sem sinal (ex: "Você está offline - 4 cadastros salvos localmente"). |
| **Arquivos Monolíticos (Lag de UI)** | 🚨 Crítico | O `CoordinatorDashboard.tsx` possui **396 KB (~8.000 linhas)** e o `CaboDashboard.tsx` possui **191 KB**. Alterar qualquer estado recalcula a árvore de renderização inteira, causando lentidão no toque mobile. |
| **Acessibilidade (a11y)** | ⚠️ Deficiente | Modais (`DocDownloadModal`, `WhatsAppDispatchModal`, `SupabaseConfigModal`) carecem de atributos `aria-dialog`, foco preso (focus trap) e fechamento universal via tecla `ESC`. |
| **Formulários e Feedback Visual** | 🟢 Bom | Boas animações com `motion` e componentes visualmente atraentes, mas faltam estados de carregamento tipo *Skeleton Screens* durante chamadas assíncronas ao banco. |

---

## ⚡ 4. VARREDURA DE TECNOLOGIAS & ARQUITETURA DE CÓDIGO

### 🛠️ Stack Tecnológico Atual
*   **Frontend Core:** React 19 + Vite 6 + TypeScript 5.8.
*   **Estilização:** Tailwind CSS v4 + Motion (Framer Motion v12) + Lucide React icons.
*   **Banco de Dados & Auth:** Firebase Firestore v12 (Cliente) + Supabase JS v2 (Integração Híbrida).
*   **Servidor Backend:** Node.js + Express 4 + tsx (Atuando como servidor de desenvolvimento, proxy de Open Graph e entrega de arquivos).
*   **Visualização & Documentos:** D3.js + Recharts + XLSX (SheetJS) + jsPDF + docx.
*   **Módulo de Inteligência:** `geminiService.ts` convertido em motor determinístico local por palavras-chave (otimização de custo/sem dependência de API paga).

### 🔍 Oportunidades de Arquitetura Técnica

1. **Ausência de Gerenciador de Estado Global Estruturado:**
   * O sistema utiliza múltiplos estados locais `useState` elevados a níveis superiores com prop-drilling intenso, somados a chamadas diretas de `onSnapshot` espalhadas nos componentes de visualização.
   * **Recomendação:** Adotar **Zustand** para centralizar a store da campanha, autenticação e estados offline.

2. **Bundle Size & Carregamento Inicial:**
   * Bibliotecas pesadas como `jspdf`, `xlsx`, `d3`, e `docx` estão sendo importadas de forma síncrona no topo dos arquivos principais. Isso infla o tamanho do bundle inicial distribuído ao navegador.
   * **Recomendação:** Aplicar *Dynamic Imports* (`import()`) sob demanda apenas quando o usuário clicar em "Exportar PDF" ou "Gerar Excel".

3. **Arquitetura de Integração Híbrida (Firebase + Supabase + Asaas):**
   * O projeto possui conectores para Firebase e Supabase convivendo paralelamente (`firebase.ts`, `supabase.ts`, `asaasConfig.ts`). Falta definir claramente qual é o banco primário da aplicação (Single Source of Truth) para evitar inconsistência de dados entre cadastros.

---

## 🏛️ 5. ARQUITETURA TARGET RECOMENDADA (ENTERPRISE ECOSYSTEM)

Para garantir **escalabilidade comercial como SaaS**, **segurança absoluta LGPD**, **alta disponibilidade** e **inteligência artificial avançada**, especificamos detalhadamente a stack recomendada para a plataforma:

```mermaid
graph TD
    User["Usuário / Cabo de Campo (Navegador/PWA)"] --> Cloudflare["Cloudflare (WAF / DNS / CDN / SSL)"]
    Cloudflare --> Vercel["Vercel / Cloudflare Pages (Frontend React 19 / Vite)"]
    Cloudflare --> Railway["Railway (Backend API Node.js / Express / BullMQ)"]
    
    Railway --> Supabase["Supabase (PostgreSQL / RLS / Auth / Storage / Realtime)"]
    Railway --> Gemini["Google Gemini API (Inteligência Artificial Política)"]
    Railway --> Resend["Resend (E-mails Transacionais & Notificações)"]
    Railway --> Stripe["Stripe (Cobrança SaaS & Assinaturas)"]
    Railway --> Evolution["Evolution API / Z-API (Disparo de WhatsApp)"]
    Railway --> Upstash["Upstash Redis (Rate Limiting & Cache)"]
    
    Vercel --> PostHog["PostHog (Product Analytics / Session Replay / LGPD)"]
    Railway --> Sentry["Sentry (Monitoramento de Erros & APM)"]
    Admin["Equipe Comercial Nexus"] --> Zoho["Zoho Suite (Zoho Mail & Zoho CRM/Desk)"]
```

---

### 🔬 Detalhamento dos Componentes da Arquitetura Recomendada

#### 1. 🚂 Railway (Hospedagem de Backend & Microsserviços)
*   **Função:** Plataforma Cloud PaaS moderna para hospedar o servidor backend Node.js/Express, tarefas agendadas (Cron Jobs) e filas de processamento em segundo plano (BullMQ).
*   **Por que utilizar:** Deploy automático via Git (CI/CD), variáveis criptografadas, zero-downtime deployments e ambiente seguro para execução de chaves privadas.

#### 2. ⚡ Supabase (Banco de Dados Principal, Auth, RLS & Storage)
*   **Função:** Atuar como o **Single Source of Truth** (PostgreSQL Relacional).
*   **Por que utilizar:** Row Level Security (RLS) nativo garantindo isolamento total por campanha e usuário, Supabase Auth com JWT/2FA, Supabase Storage para anexos e Realtime Subscriptions via WebSockets.

#### 3. 📧 Resend (Email Transacional & Notificações)
*   **Função:** Envio de e-mails transacionais de alta entregabilidade (convites, relatórios, recibos e recuperação de senha).

#### 4. 🦔 PostHog (Product Analytics & Product Intelligence LGPD)
*   **Função:** Telemetria da aplicação, análise de comportamento de usuários, gravação de sessões com mascaramento automático de PII (LGPD) e Feature Flags.

#### 5. 💼 Zoho Suite (Comunicação Corporativa & Gestão de Clientes B2B)
*   **Função:** E-mails corporativos (`@nexuspolitica.com.br`), CRM de vendas e sistema de chamados/suporte técnico para os clientes.

#### 6. 🛡️ Cloudflare (Edge Security, WAF, DNS & CDN)
*   **Função:** Primeira camada de defesa contra DDoS/SQLi, DNS de baixíssima latência e cache na borda para velocidade instantânea.

#### 7. 💳 Stripe (Gestão de Assinaturas & Cobrança SaaS)
*   **Função:** Processamento de pagamentos recorrentes e checkout transparente para contratação de planos por candidatos e partidos.

#### 8. 🧠 Google Gemini API (Inteligência Artificial Política no Backend)
*   **Função:** Transcrição de áudios de campo, geração de briefings de palanque e análise preditiva de sentimento/crises via chamadas Server-Side seguras.

#### 9. 🛠️ Serviços Adicionais Recomendados:
*   **Evolution API / Z-API:** Gateway de WhatsApp para disparos e alertas automatizados.
*   **Upstash Redis:** Rate-limiting no cadastro público e controle de filas.
*   **Sentry:** Monitoramento de erros e exceções em tempo real.

---

## 🎯 6. PLANO ESTRATÉGICO DE IMPLEMENTAÇÃO (ROADMAP BEST-PRACTICES)

```mermaid
graph TD
    A["Fase 1: Hardening de Segurança & LGPD"] --> B["Fase 2: Refatoração Modular & Desempenho"]
    B --> C["Fase 3: UX de Campo & Offline-First Total"]
    C --> D["Fase 4: Migração Target (Railway + Supabase + APIs)"]
```

---

### 🛡️ FASE 1: HARDENING DE SEGURANÇA E CONFORMIDADE LGPD (Prioridade Máxima)
1. Reescrita completa do `firestore.rules` (RBAC por Função e Campanha).
2. Sanitização do formulário público com reCAPTCHA v3 e Rate Limiting.
3. Adição de middleware `helmet` e restrição de CORS em `server.ts`.

### ⚡ FASE 2: REFATORAÇÃO DE ARQUITETURA & DESEMPENHO
1. Decomposição dos arquivos monolíticos (`CoordinatorDashboard` e `CaboDashboard`).
2. Implementação de *Code Splitting* (`React.lazy` + `Suspense`).
3. Adição de gerenciamento de estado global com **Zustand**.

### 📱 FASE 3: EXCELÊNCIA EM USABILIDADE (UX) & OPERAÇÃO OFFLINE
1. Barra de status de conectividade em tempo real para os cabos de campo (*Offline Sync Manager*).
2. UI mobile otimizada para toque (botões de 48px e Cards retráteis).

### 🚀 FASE 4: MIGRAÇÃO TARGET (RAILWAY + SUPABASE + ECOSSISTEMA APIS)
1. Migração de dados do Firestore para PostgreSQL no Supabase com RLS.
2. Deploy da API Node.js no Railway com WAF Cloudflare.
3. Conexão das APIs de suporte (Stripe, Resend, Gemini, Evolution, PostHog, Sentry).

---

## 📌 CONCLUSÃO & PRÓXIMOS PASSOS

O software possui um diferencial estratégico massivo. Com a definição de uma **nomenclatura com apelo político direto**, **hardening imediato no banco** e migração para a **Stack Enterprise recomendada**, a plataforma se tornará um produto dominante no mercado de inteligência política.

---
*Relatório gerado automaticamente para a liderança estratégica.*
