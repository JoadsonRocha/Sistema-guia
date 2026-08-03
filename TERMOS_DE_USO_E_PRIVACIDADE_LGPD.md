# ⚖️ TERMOS DE USO E POLÍTICA DE PRIVACIDADE (CONFORMIDADE LGPD & TSE)
## PLATAFORMA NEXUS POLÍTICA / SISTEMA ÁGUIA (2026)

> **Documento Jurídico de Governança de Dados, Privacidade e Conformidade Legal**  
> **Legislação Aplicável:** Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), Marco Civil da Internet (Lei nº 12.965/2014) e Resolução TSE nº 23.610/2019.  
> **Última Atualização:** Agosto de 2026

---

## 1. APRESENTAÇÃO E IDENTIFICAÇÃO DO CONTROLADOR DE DADOS

O **Nexus Política** (denominado "Plataforma" ou "Sistema") é uma tecnologia de gestão de relacionamento eleitoral, inteligência de base e controle de equipes de campo.

Para fins da Lei Geral de Proteção de Dados (LGPD - Art. 5º, VI), o **Controlador** dos dados pessoais é a **Coordenação da Campanha Eleitoral do Candidato/Partido Contratante**. O Nexus Política atua estritamente na qualidade de **Operador** (Art. 5º, VII), fornecendo a infraestrutura tecnológica criptografada e segura para o tratamento dos dados autorizados.

*   **Contato do Encarregado pelo Tratamento de Dados (DPO):** `dpo@nexuspolitica.com.br`
*   **Canal de Atendimento ao Titular de Dados:** `privacidade@nexuspolitica.com.br`

---

## 2. DADOS PESSOAIS COLETADOS E SUAS FINALIDADES

O tratamento de dados na Plataforma é pautado pelos princípios da **finalidade, adequação, necessidade, livre acesso, transparência e segurança** (Art. 6º da LGPD).

### 2.1 Dados de Eleitores e Apoiadores (Cadastrados pela Militância ou Formulário Público)
*   **Dados Coletados:** Nome completo, número de telefone/WhatsApp, bairro, município, zona eleitoral, seção eleitoral (informados voluntariamente pelo eleitor), posicionamento/sentimento politico (*Apoiador, Neutro, Oposição*) e indicações de relacionamento.
*   **Finalidade:** Gestão interna de relacionamento com apoiadores da campanha, envio de informativos de campanha autorizados pelo titular, organização de reuniões comunitárias e direcionamento de propostas eleitorais por região.
*   **Base Legal (Art. 7º, I e V da LGPD):** Consentimento livre, informado e inequívoco do titular de dados e legítimo interesse no exercício de direitos políticos de campanha conforme regulamentado pelo TSE.

### 2.2 Dados de Líderes de Equipe e Cabos Eleitorais (Usuários do Sistema)
*   **Dados Coletados:** Nome completo, e-mail corporativo/pessoal, telefone, perfil de acesso (*Role*), coordenadas de geolocalização (latitude/longitude gravadas exclusivamente durante a ação voluntária de "Assinar Ponto") e histórico de atendimento de rua.
*   **Finalidade:** Gestão de jornada de trabalho voluntário/remunerado, auditoria de presença em campo, prevenção a fraudes de ponto e alocação de recursos logísticos (combustível e materiais de propaganda).
*   **Base Legal (Art. 7º, V da LGPD):** Execução de contrato ou de procedimentos preliminares relacionados a contrato de trabalho/prestação de serviços de campanha.

### 2.3 Dados de Acesso e Telemetria de Segurança
*   **Dados Coletados:** Endereço IP, data e hora de acesso, tipo de dispositivo e navegador.
*   **Finalidade:** Cumprimento de obrigação legal de guarda de logs (Art. 15 do Marco Civil da Internet) e segurança da aplicação contra acessos não autorizados.

---

## 3. VEDAÇÃO ABSOLUTA DE VENDA E USO INDEVIDO DE DADOS (CONFORMIDADE TSE)

Em estrita observância à legislação eleitoral brasileira (Resolução TSE nº 23.610/2019, Art. 33) e à LGPD:

1.  🚫 **Proibição de Comercialização:** É **estritamente proibida** a venda, aluguel, troca ou cessão de qualquer base de dados pessoais coletada pela Plataforma para terceiros, empresas ou outras campanhas politicas.
2.  🚫 **Vedações a Consultas Não Autorizadas em Órgãos Governamentais:** A Plataforma **NÃO realiza consulta, extração ou cruzamento não autorizado** de dados junto ao banco de dados do Tribunal Superior Eleitoral (TSE), e-Título ou órgãos públicos.
3.  🔒 **Isolamento de Campanhas (Multi-tenancy RLS):** As bases de dados de cada candidato ou partido são totalmente isoladas por políticas de segurança no banco de dados (*Row Level Security - RLS*). Nenhuma campanha tem acesso aos eleitores de outra candidatura.

---

## 4. DIREITOS DOS TITULARES DE DADOS (ART. 18 DA LGPD)

Qualquer eleitor, apoiador ou colaborador cadastrado na Plataforma possui o direito constitucional de exercer seus direitos a qualquer momento e de forma gratuita através do e-mail `privacidade@nexuspolitica.com.br`:

1.  **Confirmação e Acesso:** Saber se seus dados pessoais estão sendo tratados e acessar a lista de dados.
2.  **Correção:** Solicitar a correção de dados incompletos, inexatos ou desatualizados.
3.  **Anonimização, Bloqueio ou Eliminação:** Solicitar a exclusão definitiva dos seus dados da base da campanha.
4.  **Revogação do Consentimento:** Revogar a qualquer momento a autorização para recebimento de mensagens e informativos da campanha.

---

## 5. ARMAZENAMENTO, SEGURANÇA E RETENÇÃO DE DADOS

*   **Segurança da Informação:** Todos os dados são armazenados em banco de dados relacional criptografado (**Supabase PostgreSQL**) protegido por regras estritas de *Row Level Security (RLS)*, SSL/TLS de 256 bits em trânsito e cabeçalhos defensivos de HTTP no servidor.
*   **Prazos de Retenção:**
    *   **Dados da Campanha:** Mantidos durante todo o período eleitoral até a aprovação final da Prestação de Contas pela Justiça Eleitoral (conforme prazos legais fixados pelo TSE).
    *   **Eliminação Definitiva:** Após o encerramento das obrigações legais da campanha e prestação de contas, os dados são anonimizados ou eliminados de forma segura dos servidores.

---

## 6. CLÁUSULA DE ADESÃO DO FORMULÁRIO PÚBLICO (LGPD CHECKBOX)

Em todos os formulários públicos de cadastro da Plataforma (`PublicVoterRegister.tsx`), é obrigatória a exibição da caixa de seleção (*checkbox*) com o seguinte termo de aceite explícito:

> *"Li e aceito os Termos de Uso e Política de Privacidade. Autorizo voluntariamente o tratamento dos meus dados pessoais pela Coordenação da Campanha para o recebimento de informativos e comunicações do candidato, ciente de que posso revogar este consentimento e solicitar a exclusão dos meus dados a qualquer momento."*

---

## 7. ALTERAÇÕES NA POLÍTICA DE PRIVACIDADE

Esta política poderá ser atualizada periodicamente para refletir aprimoramentos técnicos ou mudanças nas Resoluções da Justiça Eleitoral. A versão mais recente estará sempre disponível no endereço oficial `https://www.nexuspolitica.com.br/privacidade`.

---
*Documento jurídico e técnico aprovado pela Coordenação de Governança e Privacidade do Nexus Política.*
