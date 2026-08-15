# 📋 Funções Implementadas — Sistema Guia (Nexus Política)

> Relatório gerado em: 15/08/2026  
> Apenas funções **já implementadas** (com corpo real de código). Excluídas variáveis simples e stubs/placeholders.

---

## 🔐 Autenticação & Sessão
**Arquivo:** [`src/lib/SupabaseProvider.tsx`](./src/lib/SupabaseProvider.tsx)

| Função | Descrição |
|--------|-----------|
| `SupabaseProvider` | Componente de contexto global de autenticação |
| `syncUserProfile` | Sincroniza o perfil do usuário logado com o banco |
| `resetTimer` | Reinicia o timer de sessão ativa |
| `handlePageHide` | Lida com evento de saída/ocultar página |
| `handlePageShow` | Lida com evento de retornar/mostrar página |
| `onVisibility` | Gerencia mudanças de visibilidade da aba |
| `login` | Login genérico via provider OAuth |
| `loginWithEmail` | Login com e-mail e senha |
| `signupWithEmail` | Cadastro de novo usuário com e-mail e senha |
| `logout` | Encerra a sessão do usuário |
| `changePassword` | Altera a senha do usuário autenticado |
| `resetPassword` | Envia e-mail de redefinição de senha |
| `verifyEmail` | Verifica o token de confirmação de e-mail |
| `useAuth` | Hook para consumir o contexto de autenticação |

---

## 🗄️ Serviço de Dados (Supabase)
**Arquivo:** [`src/lib/supabaseService.ts`](./src/lib/supabaseService.ts)

### Funções internas (helpers privados)
| Função | Descrição |
|--------|-----------|
| `getOfflineQueue` | Retorna a fila de ações offline do localStorage |
| `pushToOfflineQueue` | Adiciona uma ação à fila offline |
| `clearOfflineQueue` | Limpa a fila de ações offline |
| `getLocalKey` | Gera chave determinística para o localStorage |
| `getLocalList` | Lê coleção em cache do localStorage |
| `setLocalList` | Persiste coleção no localStorage |

### Objeto `supabaseDataService` (API pública)
| Método | Descrição |
|--------|-----------|
| `testConnection` | Testa a conexão com o Supabase |
| `saveTreLocations` | Salva locais de votação TRE em lote no banco |
| `loadTreLocations` | Carrega locais de votação TRE de um coordenador |
| `saveCampaignRecord` | Salva um registro genérico de campanha (eleitor, líder, demanda, etc.) |
| `syncCampaignState` | Sincroniza o estado completo da campanha (upsert) |
| `loadCampaignState` | Carrega o estado completo da campanha |
| `getCollection` | Busca uma coleção completa (com fallback offline) |
| `getCount` | Conta documentos de uma coleção (com fallback offline) |
| `getDocument` | Busca um documento específico por ID |
| `setDocument` | Cria ou atualiza um documento (com sync offline) |
| `updateDocument` | Atualiza campos de um documento existente (merge) |
| `deleteDocument` | Remove um documento (com sync offline) |
| `addDocument` | Adiciona novo documento com ID auto-gerado |
| `subscribeToCollection` | Subscrição em tempo real a uma coleção |
| `subscribeToCollectionFiltered` | Subscrição filtrada por `coordinatorId` |
| `getCollectionFiltered` | Busca coleção filtrada por `coordinatorId` |
| `getCollectionPaginated` | Busca paginada com filtros de busca/intenção/voto |
| `uploadImage` | Faz upload de imagem para o Supabase Storage |
| `getQueue` | Retorna a fila offline atual |
| `clearAllLocalDemoData` | Limpa todos os dados locais/demo do localStorage |
| `processSyncQueue` | Processa e sincroniza fila offline com o banco |

---

## 📡 Conexão Supabase (Client)
**Arquivo:** [`src/lib/supabase.ts`](./src/lib/supabase.ts)

| Função | Descrição |
|--------|-----------|
| `sanitizeSupabaseUrl` | Sanitiza e valida a URL do Supabase |
| `getSupabaseCredentials` | Lê credenciais armazenadas (env ou localStorage) |
| `setSupabaseCredentials` | Salva credenciais do Supabase no localStorage |
| `getSupabaseClient` | Retorna (ou cria) o client Supabase singleton |
| `isSupabaseConfigured` | Verifica se as credenciais estão configuradas |
| `resetSupabaseClient` | Reseta o client (força reconexão) |

---

## 🗺️ Dados TRE / Locais de Votação
**Arquivo:** [`src/lib/treDataService.ts`](./src/lib/treDataService.ts)

| Função | Descrição |
|--------|-----------|
| `getDefaultRoraimaLocations` | Retorna os locais de votação padrão de Roraima |
| `parseSecoes` | Faz parse de string de seções em array |
| `normalizeZonaLabel` | Normaliza o label de zona eleitoral |
| `extractZonaNum` | Extrai o número da zona a partir de um label |
| `setTreLocationsForCoordinator` | Define locais TRE para um coordenador específico (cache) |
| `clearTreLocationsCache` | Limpa o cache de locais TRE |
| `loadTreLocationsFromFirestore` | Carrega locais TRE do Supabase/Firestore |
| `getAllTreLocations` | Retorna todos os locais TRE (cache ou banco) |
| `getTreZonas` | Lista as zonas eleitorais disponíveis |
| `getTreSecoes` | Lista as seções de uma zona/local específico |
| `getTreLocaisVotacao` | Lista os locais de votação de uma zona |
| `findTreMatch` | Busca um local TRE que corresponda a um critério |

---

## 🤖 IA / Gemini (Backend Seguro)
**Arquivo:** [`src/services/geminiService.ts`](./src/services/geminiService.ts)

| Função | Descrição |
|--------|-----------|
| `processarCaos` | Envia texto bruto para IA processar demandas/caos |
| `processarNotaAudio` | Processa transcrição de notas de áudio via IA |
| `gerarBriefingCandidato` | Gera briefing estratégico do candidato por município |

---

## 📊 Relatórios
**Arquivo:** [`src/services/reportService.ts`](./src/services/reportService.ts)

| Função | Descrição |
|--------|-----------|
| `getLogoDataUrl` | Converte o logo da campanha para Base64 (uso em PDF) |
| `reportService.generatePDF` | Gera e baixa relatório em PDF com cabeçalho Nexus |
| `reportService.generateExcel` | Gera e baixa relatório em Excel (.xlsx) |

---

## 📲 WhatsApp
**Arquivo:** [`src/services/whatsappService.ts`](./src/services/whatsappService.ts)

| Método | Descrição |
|--------|-----------|
| `formatPhoneNumber` | Sanitiza e formata número para padrão E.164 |
| `interpolateMessage` | Substitui variáveis dinâmicas no template da mensagem |
| `generateWaMeLink` | Gera link wa.me com texto pré-preenchido |
| `prepareWaMeBatch` | Prepara lote de links wa.me com interpolação |
| `logDispatch` | Grava histórico de disparo no banco |
| `getEvolutionCredentials` | Lê credenciais da Evolution API |
| `setEvolutionCredentials` | Salva credenciais da Evolution API |
| `sendEvolutionMessage` | Dispara mensagem automática via Evolution API |

---

## 📅 Agenda / Logística
**Arquivo:** [`src/lib/agendaLogic.ts`](./src/lib/agendaLogic.ts)

| Função | Descrição |
|--------|-----------|
| `aMinutos` | Converte "HH:mm" em minutos totais do dia |
| `calcularTempoDeslocamento` | Calcula tempo de viagem entre municípios de Roraima |
| `validarSugestaoAgenda` | Valida viabilidade de um novo compromisso (choque + logística) |

---

## 📋 Planos / Assinatura
**Arquivo:** [`src/lib/planService.ts`](./src/lib/planService.ts)

| Função | Descrição |
|--------|-----------|
| `getSubscriptionInfo` | Retorna informações do plano ativo do coordenador |
| `saveSubscriptionPlan` | Salva/atualiza o plano de assinatura |
| `triggerUpgradeRedirect` | Exibe alerta de limite e redireciona para upgrade |
| `validateVoterRegistration` | Valida se o limite de eleitores foi atingido |
| `validateLeaderRegistration` | Valida se o limite de líderes/equipes foi atingido |
| `validateRegionalRegistration` | Valida se o limite de coordenadores regionais foi atingido |
| `validateGeneralCoordinatorRegistration` | Valida se o limite de coordenadores gerais foi atingido |

---

## 👤 Candidatos
**Arquivo:** [`src/lib/candidateService.ts`](./src/lib/candidateService.ts)

| Função / Método | Descrição |
|--------|-----------|
| `isRealCandidate` | Verifica se um candidato tem dados reais (não é placeholder) |
| `getLocalCacheList` | Lê lista de candidatos do cache local |
| `setLocalCacheList` | Salva lista de candidatos no cache local |
| `normalizeTitle` | Normaliza o cargo do candidato para comparação |
| `candidateService.getCandidatesList` | Retorna todos os candidatos da campanha |
| `candidateService.getCandidateInfo` | Retorna o candidato principal |
| `candidateService.saveCandidate` | Cadastra ou atualiza um candidato (com unicidade de cargo) |
| `candidateService.saveCandidateInfo` | Atalho para salvar candidato único (compatibilidade) |
| `candidateService.deleteCandidate` | Remove um candidato pelo ID |
| `candidateService.subscribeCandidateInfo` | Subscrição em tempo real ao candidato principal |
| `candidateService.subscribeCandidatesList` | Subscrição em tempo real à lista de candidatos |

---

## 📍 Geolocalização (GPS)
**Arquivo:** [`src/lib/geoService.ts`](./src/lib/geoService.ts)

| Função | Descrição |
|--------|-----------|
| `getGPSLocation` | Captura GPS + reverse geocoding via OpenStreetMap Nominatim |

---

## 📦 Importação de Dados (Excel / CSV)
**Arquivo:** [`src/lib/excelParser.ts`](./src/lib/excelParser.ts)

| Função | Descrição |
|--------|-----------|
| `parseCSVText` | Faz parse de texto CSV em array de objetos |
| `countSemicolons` | Conta separadores `;` para detectar delimitador |
| `countCommas` | Conta separadores `,` para detectar delimitador |
| `countTabs` | Conta separadores `\t` para detectar delimitador |
| `parseExcelOrCSVBuffer` | Converte buffer de arquivo Excel/CSV em array de dados |

---

## 🗃️ Storage Eleitoral (IndexedDB)
**Arquivo:** [`src/lib/eleitoralStorage.ts`](./src/lib/eleitoralStorage.ts)

| Função | Descrição |
|--------|-----------|
| `openDB` | Abre (ou cria) o banco de dados IndexedDB local |

---

## 🖥️ Server / Backend (Express)
**Arquivo:** [`server.ts`](./server.ts)

| Função | Descrição |
|--------|-----------|
| `escapeHtmlAttribute` | Escapa atributos HTML para prevenção de XSS |
| `fetchCandidateInfoServer` | Busca dados do candidato no Supabase (server-side) |
| `startServer` | Inicializa o servidor Express com todas as rotas |

---

## 📄 Páginas (React)
**Arquivo:** [`src/pages/LoginPage.tsx`](./src/pages/LoginPage.tsx)

| Função | Descrição |
|--------|-----------|
| `LoginPage` | Componente da página de login |
| `handleEmailAuth` | Processa autenticação por e-mail/senha |
| `handleGoogleAuth` | Processa autenticação via Google OAuth |

**Arquivo:** [`src/pages/ProfilePage.tsx`](./src/pages/ProfilePage.tsx)

| Função | Descrição |
|--------|-----------|
| `ProfilePage` | Componente da página de perfil do usuário |
| `handlePhotoUpload` | Upload de foto do usuário |
| `handleCandidatePhotoUpload` | Upload de foto do candidato |
| `handleSubmit` | Salva alterações do perfil |
| `getRoleBadgeLabel` | Retorna o label do badge de papel/função |

**Arquivo:** [`src/pages/ForcePasswordChangePage.tsx`](./src/pages/ForcePasswordChangePage.tsx)

| Função | Descrição |
|--------|-----------|
| `ForcePasswordChangePage` | Página de troca obrigatória de senha |
| `handlePasswordChange` | Processa e valida a nova senha |

**Arquivo:** [`src/pages/DashboardPage.tsx`](./src/pages/DashboardPage.tsx)

| Função | Descrição |
|--------|-----------|
| `DashboardPage` | Roteador principal do dashboard (redireciona por role) |

---

## 🧩 App Principal
**Arquivo:** [`src/App.tsx`](./src/App.tsx)

| Função | Descrição |
|--------|-----------|
| `SyncIndicator` | Componente visual de status de sincronização |
| `SalesLandingWrapper` | Wrapper da landing page de vendas |
| `handleAccessSystem` | Lida com acesso ao sistema a partir da landing |
| `PublicRegisterWrapper` | Wrapper do formulário público de cadastro de eleitores |

---

## 🛠️ Utilitários
**Arquivo:** [`src/utils/currency.ts`](./src/utils/currency.ts)

| Função | Descrição |
|--------|-----------|
| `maskCurrency` | Aplica máscara monetária BRL em campo de texto |
| `parseCurrencyToNumber` | Converte string formatada em valor numérico |

**Arquivo:** [`src/utils/docGenerator.ts`](./src/utils/docGenerator.ts)

| Função | Descrição |
|--------|-----------|
| `downloadRequirementsDoc` | Gera e baixa documento de requisitos da campanha |

**Arquivo:** [`src/utils/generateDocxManual.ts`](./src/utils/generateDocxManual.ts)

| Função | Descrição |
|--------|-----------|
| `downloadSystemManualDocx` | Gera e baixa o manual do sistema em formato .docx |

**Arquivo:** [`src/utils/gtag.ts`](./src/utils/gtag.ts)

| Função | Descrição |
|--------|-----------|
| `trackAdsConversion` | Dispara evento de conversão para Google Ads |

---

## 📊 Resumo por Módulo

| Módulo | Qtd. de Funções |
|--------|:--------------:|
| Supabase Service (dados) | 22 |
| Autenticação (SupabaseProvider) | 14 |
| TRE / Locais de Votação | 12 |
| Candidatos | 11 |
| Planos / Assinatura | 7 |
| WhatsApp | 8 |
| Páginas React | 12 |
| Supabase Client | 6 |
| Agenda / Logística | 3 |
| IA / Gemini | 3 |
| Relatórios | 3 |
| Excel / CSV Parser | 5 |
| Geolocalização | 1 |
| Storage (IndexedDB) | 1 |
| Server / Backend | 3 |
| App Principal | 4 |
| Utilitários | 5 |
| **TOTAL** | **~120** |
