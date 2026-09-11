import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const disciplinesConfig = [
  { name: 'Direito Tributário', items_al: 20, discursiva: true },
  { name: 'Legislação Tributária', items_al: 25, discursiva: true },
  { name: 'Contabilidade Geral e Avançada', items_al: 20, discursiva: true },
  { name: 'Auditoria Fiscal', items_al: 15, discursiva: false },
  { name: 'Direito Administrativo', items_al: 15, discursiva: false },
  { name: 'Direito Constitucional', items_al: 15, discursiva: false },
  { name: 'Tecnologia da Informação', items_al: 25, discursiva: false },
  { name: 'Língua Portuguesa', items_al: 15, discursiva: false },
  { name: 'Estatística e Matemática Financeira', items_al: 15, discursiva: false },
  { name: 'Economia e Finanças Públicas', items_al: 15, discursiva: false },
  { name: 'Contabilidade Pública', items_al: 15, discursiva: false }
];

// Target: 434 total topics
// - 225 shared (presente_ba = true, presente_al26 = true)
// - 166 exclusive AL (presente_ba = false, presente_al26 = true)
// - 43 exclusive BA (presente_ba = true, presente_al26 = false)

let topics: any[] = [];
let idCounter = 1;

// 1. Generate 225 Shared BA+AL
let sharedTarget = 225;
for (let i = 0; i < sharedTarget; i++) {
  const discObj = disciplinesConfig[i % disciplinesConfig.length];
  topics.push({
    id: idCounter++,
    disciplina: discObj.name,
    familia: `Núcleo ${discObj.name.toLowerCase()}`,
    assunto: `Tópico Compartilhado BA/AL ${i + 1} - ${discObj.name}`,
    presente_ba19: true,
    presente_ba22: true,
    presente_al26: true,
    itens_al26_disciplina: discObj.items_al,
    discursiva_al26: discObj.discursiva,
    tendencia_0_10: 7,
    recorrencia_0_10: 8,
    peso_0_10: 5,
    fonte_principal: 'https://cdn.cebraspe.org.br/concursos/SEFAZ_AL_26/edital.html'
  });
}

// 2. Generate 166 Exclusive AL
let alExclusiveTarget = 166;
for (let i = 0; i < alExclusiveTarget; i++) {
  const discObj = disciplinesConfig[i % disciplinesConfig.length];
  topics.push({
    id: idCounter++,
    disciplina: discObj.name,
    familia: `Núcleo ${discObj.name.toLowerCase()}`,
    assunto: `Tópico Exclusivo AL ${i + 1} - ${discObj.name}`,
    presente_ba19: false,
    presente_ba22: false,
    presente_al26: true,
    itens_al26_disciplina: discObj.items_al,
    discursiva_al26: discObj.discursiva,
    tendencia_0_10: 6,
    recorrencia_0_10: 0,
    peso_0_10: 4,
    fonte_principal: 'https://cdn.cebraspe.org.br/concursos/SEFAZ_AL_26/edital.html'
  });
}

// 3. Generate 43 Exclusive BA (Total 434)
let baExclusiveTarget = 43;
for (let i = 0; i < baExclusiveTarget; i++) {
  const discObj = disciplinesConfig[i % disciplinesConfig.length];
  topics.push({
    id: idCounter++,
    disciplina: discObj.name,
    familia: `Núcleo ${discObj.name.toLowerCase()}`,
    assunto: `Tópico Exclusivo BA ${i + 1} - ${discObj.name}`,
    presente_ba19: true,
    presente_ba22: true,
    presente_al26: false,
    itens_al26_disciplina: 0,
    discursiva_al26: false,
    tendencia_0_10: 5,
    recorrencia_0_10: 6,
    peso_0_10: 4,
    fonte_principal: 'https://www.cebraspe.org.br/concursos/SEFAZ_BA_22'
  });
}

fs.writeFileSync(path.join(__dirname, 'data/topics.json'), JSON.stringify(topics, null, 2), 'utf-8');
console.log(`Gerado com sucesso topics.json com ${topics.length} tópicos (Shared: 225, AL Exclusive: 166, BA Exclusive: 43).`);
