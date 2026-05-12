# 🦅 Documentação Técnica: Sistema Águia (Coordenação Estratégica 2026)

Este documento detalha o funcionamento completo do **Sistema Águia**, organizando-o por hierarquia, blocos funcionais, atores e fluxos de interconexão.

---

## 🔝 1. Hierarquia de Atores e Acessos

O sistema opera sob uma estrutura de comando rígida, garantindo que a informação flua do terreno para o centro de decisão de forma segura.

| Ator | Nível | Responsabilidades Principais | Acesso (Database) |
| :--- | :--- | :--- | :--- |
| **Administrador Master (Sérgio)** | 0 (Root) | Auditoria total, gestão de infraestrutura e bypass de segurança. | Full Read/Write |
| **Coordenador Estratégico** | 1 (Comando) | Gestão de regionais, fatiamento de recursos e análise por IA. | Coleções Globais |
| **Líder de Equipe (Cabo)** | 2 (Campo) | Operação de terreno, coleta de dados e solicitações de logística. | Próprios Documentos |

---

## 🧊 2. Blocos Funcionais (Módulos do Sistema)

O sistema é construído em blocos modulares que operam de forma integrada:

### 💼 Bloco A: Inteligência Estratégica (Comando)
*   **Organizador de Caos (IA Gemini):** Transforma relatos amorfos de campo em dados estruturados (Tarefas, Ações Políticas e Alertas de Risco).
*   **Dashboard de Urgências:** Sistema de triagem para solicitações vindas do campo.
*   **Gestão de Regionais:** Monitoramento de status das bases (OK/Alerta/Crise).

### 🛠️ Bloco B: Logística Operacional (Campo)
*   **Módulo de Cadastro (Voters):** Captura de inteligência eleitoral com campos para observações privadas.
*   **Check-in Georreferenciado:** Sistema de "batida de ponto" que valida a presença do líder na localidade designada via GPS.
*   **Offline First:** Gestão de fila em áreas críticas de sombra de sinal (sincronização automática).

### 💰 Bloco C: Caixa Forte (Financeiro)
*   **Arrecadação Central:** Gestão do fundo total da campanha.
*   **Fatiamento (Cotas):** Distribuição de recursos do caixa central para as carteiras das equipes regionais.
*   **Gestão de Insumos (Combustível):** Conversão de valores financeiros em litros de combustível para autonomia de campo.

### 📢 Bloco D: Ouvidoria e Demandas
*   **Monitor de Crises:** Recebimento de alertas de fraude ou problemas sociais.
*   **Feedback Loop:** Resposta direta do comando para o líder no terreno.

---

## 🛠️ 3. Detalhamento de Funções por Ator

### Para o Coordenador (Comando):
1.  **analisarSolicitacao():** Abre modal para aprovar/negar pedidos de verba/combustível.
2.  **processarCaos():** Envia texto para o Gemini extrair tarefas.
3.  **criarEquipe():** Define nova base regional, líder e cota inicial.
4.  **monitorarFinanceiro():** Visualiza lucro/gasto e extrato de transações.

### Para o Líder de Equipe (Campo):
1.  **cadastrarEleitor():** Salva dados de contatos no Firestore (vinculado ao líder).
2.  **pedirCombustivel():** Gera uma entrada na coleção `urgencies` para aprovação.
3.  **registrarDemanda():** Reporta problemas da comunidade.
4.  **baterPonto():** Envia selfie e coordenadas para validação de rota.

---

## 📡 4. Ligações e Fluxos de Dados (Conexões)

As conexões entre os blocos garantem que o sistema seja um organismo vivo:

1.  **Do Campo para o Comando (Solicitação):** O Líder cria um documento em `/urgencies`. O Coordenador recebe um alerta em tempo real (`onSnapshot`) e reage.
2.  **Do Financeiro para o Logístico (Aprovação):** Ao aprovar uma verba, o sistema debita do `allocated` da Equipe e atualiza as `stats/global`, permitindo que o Líder visualize seu "vale" liberado.
3.  **Dos Contatos para as Metas (Estatística):** Cada eleitor cadastrado em `/voters` dispara um gatilho de interface que atualiza a `meta de campanha` no dashboard principal.
4.  **Do Relato para a Ação (IA):** O relato do Coordenador sobre uma reunião é processado pela IA, que pode sugerir a criação de uma nova **Demanda** ou **Equipe**, fechando o ciclo de gestão.

---

## 🔒 5. Regras de Integridade (Security Policy)

*   **Pilar de Autoria:** O campo `leaderId` é obrigatório em todas as funções de escrita, garantindo rastreabilidade.
*   **Pilar de Veracidade:** Geolocalização é capturada silenciosamente em ações críticas.
*   **Pilar de Blindagem:** Acesso via Email Corporativo Google, com hierarquia protegida por regras do Firestore.

