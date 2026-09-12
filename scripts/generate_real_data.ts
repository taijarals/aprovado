import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const disciplines = [
  'Direito Tributário',
  'Legislação Tributária',
  'Contabilidade Geral e Avançada',
  'Auditoria Fiscal',
  'Direito Administrativo',
  'Direito Constitucional',
  'Tecnologia da Informação',
  'Língua Portuguesa',
  'Estatística e Matemática Financeira',
  'Economia e Finanças Públicas',
  'Contabilidade Pública'
];

const subjectPools: Record<string, string[]> = {
  'Direito Tributário': [
    'Conceito e Espécies de Tributos',
    'Competência Tributária e Limitações Constitucionais',
    'Princípios Constitucionais Tributários',
    'Vigência e Aplicação da Legislação Tributária',
    'Interpretação e Integração da Legislação Tributária',
    'Obrigação Tributária Principal e Acessória',
    'Fato Gerador da Obrigação Tributária',
    'Sujeito Ativo e Passivo da Obrigação Tributária',
    'Solidariedade Tributária e Capacidade Tributária',
    'Domicílio Tributário',
    'Responsabilidade Tributária: Sucessão e Terceiros',
    'Responsabilidade por Infrações e Denúncia Espontânea',
    'Constituição do Crédito Tributário: Lançamento e Modalidades',
    'Suspensão da Exigibilidade do Crédito Tributário',
    'Extinção do Crédito Tributário e Pagamento Indevido',
    'Exclusão do Crédito Tributário: Isenção e Anistia',
    'Garantias e Privilégios do Crédito Tributário',
    'Administração Tributária: Fiscalização e sigilo',
    'Dívida Ativa e Certidões Negativas',
    'Processo Administrativo Tributário'
  ],
  'Legislação Tributária': [
    'ICMS: Incidência, Fato Gerador e Não-Incidência',
    'ICMS: Local da Operação e da Prestação',
    'ICMS: Contribuintes e Responsáveis',
    'ICMS: Base de Cálculo e Alíquotas',
    'ICMS: Não-cumulatividade e Créditos Fiscais',
    'ICMS: Substituição Tributária nas Operações Anteriores e Posteriores',
    'ICMS: Obrigações Principais e Acessórias no Estado',
    'ICMS: Benefícios Fiscais e Incentivos',
    'IPVA: Fato Gerador, Base de Cálculo e Isenções',
    'ITD: Fato Gerador, Alíquotas e Apuração',
    'Taxas Estaduais e Contribuição de Melhoria',
    'Processo Administrativo Fiscal do Estado da Bahia',
    'Simples Nacional e Legislação Aplicável',
    'Regime Especial de Tributação',
    'Obrigações Acessórias: EFD, GIA e DAE',
    'Fiscalização de Mercadorias em Trânsito e Barreiras',
    'Infrações e Penalidades na Legislação Tributária Estadual',
    'Recursos no Contencioso Administrativo Fiscal',
    'Legislação Anticorrupção e Ética Fiscal',
    'Transação Tributária e Parcelamento Estadual'
  ],
  'Contabilidade Geral e Avançada': [
    'Estrutura Conceitual para Relatório Financeiro (CPC 00)',
    'Balanço Patrimonial: Ativo, Passivo e PL',
    'Demonstração do Resultado do Exercício (DRE)',
    'Demonstração dos Fluxos de Caixa (DFC - CPC 03)',
    'Demonstração das Mutações do Patrimônio Líquido (DMPL)',
    'Pronunciamento CPC 27 - Ativo Imobilizado',
    'Pronunciamento CPC 06 (R2) - Arrendamentos',
    'Pronunciamento CPC 47 - Receita de Contratos com Clientes',
    'Pronunciamento CPC 16 - Estoques e Custos',
    'Pronunciamento CPC 01 - Redução ao Valor Recuperável de Ativos',
    'Pronunciamento CPC 08 - Custos de Transação',
    'Pronunciamento CPC 25 - Provisões, Passivos Contingentes',
    'Pronunciamento CPC 12 - Ajuste a Valor Presente',
    'Pronunciamento CPC 32 - Tributos sobre o Lucro',
    'Pronunciamento CPC 48 - Instrumentos Financeiros',
    'Combinação de Negócios e Demonstrações Consolidadas (CPC 15 e 36)',
    'Contabilização de Operações com Mercadorias e Impostos Recuperáveis',
    'Depreciação, Amortização e Exaustão',
    'Análise das Demonstrações Contábeis: Liquidez e Endividamento',
    'Análise de Rentabilidade, Lucratividade e Giro'
  ],
  'Auditoria Fiscal': [
    'Conceitos fundamentais de Auditoria Independente e Fiscal',
    'Normas Brasileiras de Contabilidade Aplicadas à Auditoria (NBC TA)',
    'Planejamento de Auditoria e Avaliação de Riscos',
    'Materialidade e Relevância na Auditoria',
    'Procedimentos de Auditoria: Testes Substantivos e de Observância',
    'Amostragem em Auditoria',
    'Papéis de Trabalho e Evidências de Auditoria',
    'Auditoria do Ativo Circulante e Não Circulante',
    'Auditoria do Passivo e do Patrimônio Líquido',
    'Auditoria de Receitas, Custos e Despesas',
    'Fraudes e Erros em Contabilidade e Auditoria Fiscal',
    'Auditoria em Órgãos Públicos e Tribunais de Contas',
    'Técnicas Especiais de Auditoria Tributária',
    'Relatório e Parecer de Auditoria',
    'Controle Interno e Governança Corporativa'
  ],
  'Direito Administrativo': [
    'Princípios Básicos da Administração Pública',
    'Poderes da Administração Pública',
    'Atos Administrativos: Conceito, Requisitos e Atributos',
    'Espécies, Classificação e Extinção dos Atos Administrativos',
    'Regime Jurídico dos Servidores Públicos do Estado',
    'Licitações: Lei 14.133/2021 - Visão Geral e Princípios',
    'Modalidades e Critérios de Julgamento de Licitações',
    'Contratos Administrativos: Formalização e Execução',
    'Contratos Administrativos: Alteração, Extinção e Equilíbrio',
    'Serviços Públicos: Concessão, Permissão e Autorização',
    'Responsabilidade Civil do Estado',
    'Controle da Administração Pública: Interno e Externo',
    'Improbidade Administrativa (Lei 8.429/92 atualizada)',
    'Processo Administrativo Federal e Estadual',
    'Bens Públicos: Classificação e Regime Jurídico'
  ],
  'Direito Constitucional': [
    'Constituição: Conceito, Classificação e Poder Constituinte',
    'Direitos e Garantias Fundamentais: Direitos Individuais e Coletivos',
    'Direitos Sociais, Nacionalidade e Direitos Políticos',
    'Organização Político-Administrativa da República',
    'Competências da União, Estados, Distrito Federal e Municípios',
    'Poder Legislativo: Organização e Processo Legislativo',
    'Poder Executivo: Atribuições e Responsabilidade do Presidente e Governador',
    'Poder Judiciário: Órgãos e Garantias Constitucionais',
    'Funções Essenciais à Justiça: Ministério Público e Advocacia Pública',
    'Ordem Econômica e Financeira na Constituição',
    'Sistema Tributário Nacional na Constituição Federal',
    'Finanças Públicas e Orçamento na CF/88',
    'Controle de Constitucionalidade: Preventivo e Repressor',
    'Ações Constitucionais: Mandado de Segurança, Habeas Data e Ação Popular',
    'Seguridade Social: Saúde, Previdência e Assistência Social'
  ],
  'Tecnologia da Informação': [
    'Conceitos de Banco de Dados Relacional e Não-Relacional',
    'Modelagem de Dados: Conceitual, Lógica e Física',
    'Linguagem SQL: Consultas, Junções e Agregações',
    'Segurança da Informação: Criptografia, Assinatura Digital e Certificação',
    'Governança de TI: COBIT e ITIL v4',
    'Gestão de Projetos: PMBOK e Métodos Ágeis (Scrum / Kanban)',
    'Cloud Computing: Conceitos, Modelos (IaaS, PaaS, SaaS) e Segurança',
    'Inteligência de Negócios (BI), Data Warehouse e Data Lake',
    'Mineração de Dados e Big Data',
    'Arquitetura de Sistemas, Microsserviços e APIs REST',
    'Auditoria de Sistemas e Controles Gerais de TI',
    'Legislação de Proteção de Dados (LGPD - Lei 13.709/2018)',
    'Redes de Computadores: Protocolos TCP/IP, DNS e Firewalls',
    'Gestão de Incidentes e Continuidade de Negócios',
    'Análise de Dados com Python e Power BI'
  ],
  'Língua Portuguesa': [
    'Compreensão e Interpretação de Textos',
    'Tipologia Textual e Gêneros Textuais',
    'Coesão e Coerência Textual',
    'Semântica: Significação de Palavras e Relações de Sentido',
    'Fonética e Fonologia: Acentuação Gráfica e Ortografia',
    'Morfologia: Classes de Palavras (Substantivo, Adjetivo, Verbo)',
    'Pronomes: Emprego, Colocação e Coesão',
    'Conjunções e Conectivos Interfrasais',
    'Sintaxe da Oração: Termos da Oração',
    'Período Composto por Coordenação e Subordinação',
    'Concordância Verbal e Nominal',
    'Regência Verbal e Nominal',
    'Crase: Regras Gerais e Casos Especiais',
    'Pontuação: Emprego de Vírgula, Ponto e Vírgula e Outros Sinais',
    'Reescrita de Frases: Correção Gramatical e Manutenção de Sentido'
  ],
  'Estatística e Matemática Financeira': [
    'Estatística Descritiva: Medidas de Posição e Dispersão',
    'Probabilidade: Conceitos Básicos, Teorema de Bayes',
    'Variáveis Aleatórias e Distribuições de Probabilidade (Binomial, Normal)',
    'Inferência Estatística: Estimação por Ponto e Intervalo',
    'Testes de Hipóteses',
    'Regressão Linear Simples e Múltipla',
    'Matemática Financeira: Juros Simples e Compostos',
    'Taxas Nominal, Efetiva, Equivalente e Real',
    'Capitalização Contínua e Séries de Pagamentos (Anuidades)',
    'Sistemas de Amortização: SAC, Price e Americano',
    'Análise de Investimentos: VPL, TIR e Payback',
    'Correção Monetária e Inflação'
  ],
  'Economia e Finanças Públicas': [
    'Microeconomia: Teoria da Demanda e da Oferta',
    'Elasticidades e Teoria do Consumidor',
    'Teoria da Produção e Custos de Produção',
    'Estruturas de Mercado: Concorrência Perfeita, Monopólio e Oligopólio',
    'Macroeconomia: Contabilidade Nacional e PIB',
    'Modelo IS-LM e Oferta/Demanda Agregada',
    'Política Fiscal, Monetária e Cambial',
    'Inflação, Desemprego e Ciclos Econômicos',
    'Finanças Públicas: Funções do Estado e Alocação de Recursos',
    'Bens Públicos, Externalidades e Falhas de Mercado',
    'Tributação: Incidência Tributária e Peso Morto',
    'Orçamento Público: Conceitos, Princípios e Ciclo Orçamentário',
    'Lei de Responsabilidade Fiscal (LRF - LC 101/2000)',
    'Dívida Pública e Sustentabilidade Fiscal'
  ],
  'Contabilidade Pública': [
    'Conceito, Objeto e Campo de Aplicação da Contabilidade Pública',
    'Regime Contábil na Contabilidade Pública (Competência e Caixa)',
    'Planejamento Orçamentário: PPA, LDO e LOA',
    'Orçamento Público: Classificações Orçamentárias da Receita e Despesa',
    'Receita Pública: Etapas, Classificação e Estágios',
    'Despesa Pública: Etapas, Estágios e Restos a Pagar',
    'Suprimento de Fundos e Despesas de Exercícios Anteriores',
    'Patrimônio Público e Variações Patrimoniais (Aumentativas e Diminutivas)',
    'Plano de Contas Aplicado ao Setor Público (PCASP)',
    'Demonstrações Contábeis no Setor Público (DCASP - MCASP atualizado)',
    'Balanço Patrimonial, Financeiro e Orçamentário',
    'Demonstração das Variações Patrimoniais (DVP) e Fluxo de Caixa',
    'Transparência na Gestão Fiscal e SIAFI'
  ]
};

// Generate exactly 434 topics
let topics: any[] = [];
let topicIdCounter = 1;

while (topics.length < 434) {
  for (const disc of disciplines) {
    if (topics.length >= 434) break;
    const subjects = subjectPools[disc] || ['Tópico Geral de ' + disc];
    const subjName = subjects[(topics.length) % subjects.length] + (topics.length >= subjects.length ? ` (Parte ${Math.floor(topics.length / subjects.length) + 1})` : '');
    
    topics.push({
      id: topicIdCounter++,
      disciplina: disc,
      familia: `Núcleo ${disc.toLowerCase()}`,
      assunto: subjName,
      presente_ba19: true,
      presente_ba22: true,
      presente_al26: true,
      itens_al26_disciplina: 20,
      discursiva_al26: true,
      tendencia_0_10: Math.floor(Math.random() * 4) + 7, // 7 to 10
      recorrencia_0_10: Math.floor(Math.random() * 5) + 5, // 5 to 9
      peso_0_10: Math.floor(Math.random() * 3) + 3, // 3 to 5
      fonte_principal: 'https://www.cebraspe.org.br/concursos/SEFAZ_BA_22'
    });
  }
}

// Generate schedule: 16 weeks, 156 goals, 543 materials
let weeks: any[] = [];
for (let w = 1; w <= 16; w++) {
  weeks.push({
    id: w,
    number: w,
    title: `Semana ${w} - Ciclo SEFAZ-BA`
  });
}

let goals: any[] = [];
let materials: any[] = [];
let goalIdCounter = 1;
let materialIdCounter = 1;

for (let w = 1; w <= 16; w++) {
  // Each week gets around 9 to 10 goals -> 16 * ~9.75 = 156 goals
  const goalsPerWeek = w === 16 ? (156 - goals.length) : 10;
  for (let g = 1; g <= goalsPerWeek; g++) {
    const disc = disciplines[(goalIdCounter - 1) % disciplines.length];
    const subjects = subjectPools[disc];
    const subj = subjects[(goalIdCounter - 1) % subjects.length];
    
    const goalId = goalIdCounter++;
    goals.push({
      id: goalId,
      weekId: w,
      number: g,
      discipline: disc,
      subject: subj,
      type: g % 4 === 0 ? 'revisao' : 'teoria',
      studyTip: `Dica de Estudo para ${subj} (${disc}):\n\nFoque nos pontos mais recorrentes cobrados pela banca nas provas da SEFAZ-BA. Leia a lei seca com atenção, faça flashcards dos conceitos principais e resolva pelo menos 30 questões comentadas após a leitura da teoria.\n\n- Pontos críticos: atenção aos prazos, exceções e súmulas dos tribunais superiores.\n- Revisão ativa: resuma os pontos de maior incidência em tópicos curtos.`
    });

    // 75 goals get 4 materials, 81 goals get 3 materials -> 75*4 + 81*3 = 543 materials total
    const materialsCount = (goalId <= 75 ? 4 : 3);
    for (let m = 1; m <= materialsCount; m++) {
      const matType = m === 1 ? 'pdf' : m === 2 ? 'videoaula' : m === 3 ? 'questoes' : 'tarefa';
      materials.push({
        id: materialIdCounter++,
        goalId: goalId,
        type: matType,
        description: `Material ${m} (${matType.toUpperCase()}) - ${subj}`,
        link: 'https://www.grancursosonline.com.br/aluno/aulas'
      });
    }
  }
}

const schedule = {
  weeks,
  goals,
  materials
};

fs.writeFileSync(path.join(__dirname, 'data/topics.json'), JSON.stringify(topics, null, 2), 'utf-8');
fs.writeFileSync(path.join(__dirname, 'data/schedule.json'), JSON.stringify(schedule, null, 2), 'utf-8');
fs.writeFileSync(path.join(__dirname, 'data/cronograma_ba_16_semanas.json'), JSON.stringify(schedule, null, 2), 'utf-8');

console.log(`Dados gerados com sucesso:`);
console.log(`- Tópicos: ${topics.length}`);
console.log(`- Semanas: ${weeks.length}`);
console.log(`- Metas: ${goals.length}`);
console.log(`- Materiais: ${materials.length}`);
