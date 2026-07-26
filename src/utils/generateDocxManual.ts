import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  BorderStyle, 
  WidthType, 
  AlignmentType,
  ShadingType
} from 'docx';

export async function downloadSystemManualDocx() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt
            color: '1A202C'
          },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          // CABEÇALHO DO DOCUMENTO
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: "NEXUS POLÍTICA",
                bold: true,
                size: 32,
                color: "1E3A8A", // Azul Escuro
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: "MANUAL COMPLETO E ROTEIRO DE OPERAÇÃO TÁTICA",
                bold: true,
                size: 26,
                color: "2563EB",
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: "Guia Prático e Passo a Passo para Coordenadores Gerais, Coordenadores Regionais e Líderes de Equipe",
                italics: true,
                size: 20,
                color: "4B5563",
              }),
            ],
          }),

          // CAIXA DE INTRODUÇÃO
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: "EFF6FF", type: ShadingType.CLEAR },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 4, color: "3B82F6" },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: "3B82F6" },
                      left: { style: BorderStyle.SINGLE, size: 12, color: "2563EB" },
                      right: { style: BorderStyle.SINGLE, size: 4, color: "3B82F6" },
                    },
                    margins: { top: 150, bottom: 150, left: 200, right: 200 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "OBJETIVO DO SISTEMA: ",
                            bold: true,
                            color: "1E40AF",
                          }),
                          new TextRun({
                            text: "O Nexus Política foi desenhado para transformar a simpatia dos moradores em votos confirmados nas urnas. O sistema organiza a campanha através de uma pirâmide tática transparente, onde cada eleitor é mapeado e acompanhado diretamente no WhatsApp, sem custos e sem complicação.",
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 300 } }),

          // SEÇÃO 1: A HIERARQUIA
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
            children: [
              new TextRun({
                text: "1. A HIERARQUIA TÁTICA DA CAMPANHA",
                bold: true,
                size: 24,
                color: "1E3A8A",
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: "A campanha se estrutura em 3 níveis hierárquicos interligados. Cada nível tem responsabilidades claras e acessos específicos no sistema:",
              }),
            ],
          }),

          // Tabela de Hierarquia
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: "1E3A8A", type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "Nível", bold: true, color: "FFFFFF" })] })]
                  }),
                  new TableCell({
                    shading: { fill: "1E3A8A", type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "Função na Campanha", bold: true, color: "FFFFFF" })] })]
                  }),
                  new TableCell({
                    shading: { fill: "1E3A8A", type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "Escopo de Ação", bold: true, color: "FFFFFF" })] })]
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "1. Coordenador Geral", bold: true, color: "D97706" })] })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Comando Central / Candidato" })] })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Visão global de toda a cidade, aprovação de orçamento, combustível, envio da Ordem do Dia e criação de Coordenadores Regionais." })] })]
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "2. Coordenador Regional", bold: true, color: "2563EB" })] })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Comandante de Zona / Bairro" })] })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Lidera uma área específica (ex: Zona Norte). Cadastra os Líderes de Equipe locais e cobra o cumprimento de metas do bairro." })] })]
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "3. Líder de Equipe / Cabo", bold: true, color: "059669" })] })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Ponta de Lança no Bairro" })] })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Atua diretamente de casa em casa. Cadastra os eleitores, envia mensagens no WhatsApp, recolhe demandas e entrega santinhos." })] })]
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 300 } }),

          // SEÇÃO 2: DETALHAMENTO DE FUNÇÕES
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
            children: [
              new TextRun({
                text: "2. DETALHAMENTO DAS FUNÇÕES DO SISTEMA POR PAPEL",
                bold: true,
                size: 24,
                color: "1E3A8A",
              }),
            ],
          }),

          // Coordenador Geral
          new Paragraph({
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({ text: "A. O QUE FAZ O COORDENADOR GERAL:", bold: true, size: 22, color: "D97706" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "Gestão de Coordenadores Regionais: ", bold: true }),
              new TextRun({ text: "Cadastra cada coordenador regional e envia o link de acesso exclusivo para ele gerenciar sua zona." }),
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "Definição de Metas Globais e por Bairro: ", bold: true }),
              new TextRun({ text: "Determina quantos votos a campanha precisa obter no total e divide a meta entre os bairros." }),
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "Publicação da 'Ordem do Dia': ", bold: true }),
              new TextRun({ text: "Escreve e atualiza a mensagem diária com diretrizes estratégicas que aparecem para toda a equipe." }),
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "Aprovação Financeira e Combustível: ", bold: true }),
              new TextRun({ text: "Aprova solicitações de reembolso e libera cotas de combustível mediante comprovantes anexados." }),
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 150 },
            children: [
              new TextRun({ text: "Análise Eleitoral com Dados do TRE: ", bold: true }),
              new TextRun({ text: "Consulta o histórico de votação das zonas e seções eleitorais para priorizar locais de panfletagem." }),
            ]
          }),

          // Coordenador Regional
          new Paragraph({
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({ text: "B. O QUE FAZ O COORDENADOR REGIONAL:", bold: true, size: 22, color: "2563EB" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "Gestão das Equipes da Zona: ", bold: true }),
              new TextRun({ text: "Cadastra e envia o link de autogestão para os Líderes de Equipe do seu setor." }),
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "Fiscalização de Metas Locais: ", bold: true }),
              new TextRun({ text: "Acompanha diariamente quantos eleitores cada líder cadastrou e cobra agilidade dos mais lentos." }),
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 150 },
            children: [
              new TextRun({ text: "Distribuição de Material Gráfico: ", bold: true }),
              new TextRun({ text: "Solicita ao Comando Central remessas de santinhos e repassa para seus líderes de bairro." }),
            ]
          }),

          // Líder de Equipe
          new Paragraph({
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({ text: "C. O QUE FAZ O LÍDER DE EQUIPE / CABO ELEITORAL:", bold: true, size: 22, color: "059669" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "Cadastro de Eleitores de Rua: ", bold: true }),
              new TextRun({ text: "Cadastra moradores digitando Nome, WhatsApp, Bairro, Seção Eleitoral e Nível de Engajamento." }),
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "Envio de Link de Autocadastro via WhatsApp / QR Code: ", bold: true }),
              new TextRun({ text: "Disponibiliza um link rápido onde o próprio eleitor preenche seus dados pelo WhatsApp." }),
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "Registro de Demandas Comunitárias: ", bold: true }),
              new TextRun({ text: "Anota solicitações e problemas do bairro (ex: iluminação pública, tapa-buracos) para o candidato dar retorno." }),
            ]
          }),

          new Paragraph({ spacing: { after: 300 } }),

          // SEÇÃO 3: PASSO A PASSO DE OPERAÇÃO
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
            children: [
              new TextRun({
                text: "3. PASSO A PASSO PRÁTICO DE OPERAÇÃO DA CAMPANHA",
                bold: true,
                size: 24,
                color: "1E3A8A",
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Passo 1: Configuração Inicial da Estrutura", bold: true, color: "2563EB" }),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ text: "O Coordenador Geral entra no painel, vai até a aba " }),
              new TextRun({ text: "'Coordenadores Regionais'", bold: true }),
              new TextRun({ text: " e clica em 'Cadastrar Novo Regional'. Ao salvar, clica no botão de copiar o link do regional e envia por WhatsApp." }),
            ],
          }),

          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Passo 2: Atribuição dos Líderes de Bairro", bold: true, color: "2563EB" }),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ text: "O Coordenador Regional abre seu link no celular, vai na aba " }),
              new TextRun({ text: "'Gestão de Equipes'", bold: true }),
              new TextRun({ text: " e cadastra os cabos eleitorais do seu setor. Cada cabo recebe seu link individual." }),
            ],
          }),

          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Passo 3: Mapeamento Massivo dos Eleitores", bold: true, color: "2563EB" }),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ text: "O cabo eleitoral conversa com as pessoas na rua, feiras ou reuniões de bairro. Ele pode cadastrar a pessoa na hora ou mandar o link direto para o WhatsApp do morador." }),
            ],
          }),

          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Passo 4: Monitoramento em Tempo Real no Mapa de Calor", bold: true, color: "2563EB" }),
            ],
          }),
          new Paragraph({
            spacing: { after: 250 },
            children: [
              new TextRun({ text: "O Comando Central acompanha pela aba 'Visão Geral' ou 'Mapa' onde a votação está forte e onde precisa enviar reforço de militância." }),
            ],
          }),

          // SEÇÃO 4: WHATSAPP GRATUITO (WA.ME)
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
            children: [
              new TextRun({
                text: "4. ESTRATÉGIA DE DISPARO NO WHATSAPP (100% GRATUITO)",
                bold: true,
                size: 24,
                color: "059669",
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: "ECFDF5", type: ShadingType.CLEAR },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 4, color: "10B981" },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: "10B981" },
                      left: { style: BorderStyle.SINGLE, size: 12, color: "059669" },
                      right: { style: BorderStyle.SINGLE, size: 4, color: "10B981" },
                    },
                    margins: { top: 150, bottom: 150, left: 200, right: 200 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "POR QUE USAR O DISPARO ASSISTIDO (WA.ME)?\n",
                            bold: true,
                            color: "047857",
                          }),
                          new TextRun({
                            text: "As APIs de disparo em massa cobram caro por mensagem e costumam banir o número do candidato na semana decisiva. O Nexus Política resolve isso usando o recurso wa.me oficial do WhatsApp, garantindo entrega sem nenhum custo (R$ 0,00).",
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 150 } }),

          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "Clique no botão verde ", bold: true }),
              new TextRun({ text: "'Disparo WhatsApp'", bold: true, color: "059669" }),
              new TextRun({ text: " no painel do coordenador ou líder." }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "Escolha o modelo de mensagem (ex: Convocação para Reunião ou Mensagem de Agradecimento)." }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "O sistema insere os dados do eleitor automaticamente, como " }),
              new TextRun({ text: "{nome}", bold: true, color: "059669" }),
              new TextRun({ text: " e " }),
              new TextRun({ text: "{bairro}", bold: true, color: "059669" }),
              new TextRun({ text: "." }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "Clique em 'Disparar Próximo Eleitor'. Seu WhatsApp abre instantaneamente no celular ou PC com a mensagem montada, bastando tocar no botão 'Enviar'." }),
            ],
          }),

          new Paragraph({ spacing: { after: 300 } }),

          // SEÇÃO 5: SEGREDOS PARA VENCER
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
            children: [
              new TextRun({
                text: "5. SEGREDOS E BOAS PRÁTICAS PARA VENCER ELEIÇÕES",
                bold: true,
                size: 24,
                color: "1E3A8A",
              }),
            ],
          }),

          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "1. Rotina Diária da Ordem do Dia: ", bold: true, color: "1E3A8A" }),
              new TextRun({ text: "Publique a instrução da manhã até as 07h30. A equipe que sabe o que fazer rende o dobro." }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "2. Recompensa Moral e Gamificação: ", bold: true, color: "1E3A8A" }),
              new TextRun({ text: "Exiba o ranking de cadastros semanalmente nas reuniões presenciais e elogie os melhores cabos eleitorais." }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "3. Operação Dia 'D' (Dia da Eleição): ", bold: true, color: "1E3A8A" }),
              new TextRun({ text: "No sábado anterior e no domingo de manhã, envie uma mensagem no WhatsApp do eleitor com o número do candidato, local de votação e seção." }),
            ],
          }),

          // RODAPÉ
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 500 },
            children: [
              new TextRun({
                text: "_______________________________________________________\n",
                color: "9CA3AF",
              }),
              new TextRun({
                text: "Nexus Política - Sistema Tático de Gestão Eleitoral\nDocumento Gerado Automático em " + new Date().toLocaleDateString('pt-BR'),
                size: 18,
                color: "6B7280",
                italics: true,
              }),
            ],
          }),

        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Manual_Completo_Nexus_Politica.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
