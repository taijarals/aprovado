import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega as variáveis do .env na raiz do projeto
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERRO: Faltam VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env');
  console.error('Para rodar o seed, precisamos da chave de Service Role para ignorar o RLS.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'aprovado' }
});

// Fórmula de prioridade: (Recorrência + 1) * Peso * Fator_Tendencia
function calculatePriority(recurrence: number, trend: string, weight: number): number {
  const trendFactor = trend === 'crescente' ? 1.2 : trend === 'decrescente' ? 0.8 : 1.0;
  return (recurrence + 1) * weight * trendFactor;
}

async function runSeed() {
  console.log('Iniciando o Seed do Banco de Dados...');

  let topicsData: any[] = [];
  let scheduleData: any = {};

  try {
    topicsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/topics.json'), 'utf-8'));
    scheduleData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/schedule.json'), 'utf-8'));
  } catch (error) {
    console.error('ATENÇÃO: Arquivos de dados não encontrados ou vazios. Cole os dados fornecidos nos arquivos JSON na pasta scripts/data/.');
    process.exit(1);
  }

  if (topicsData.length === 0 || !scheduleData.semanas || scheduleData.semanas.length === 0) {
    console.log('Nenhum dado encontrado para processar. Preencha scripts/data/topics.json e schedule.json.');
    return;
  }

  // 1. Criar ou buscar Exame SEFAZ-BA
  let examId = '';
  const { data: existingExam, error: examErr } = await supabase
    .from('exams')
    .select('id')
    .eq('name', 'SEFAZ-BA')
    .single();

  if (!existingExam) {
    console.log('Criando edital SEFAZ-BA...');
    const { data: newExam, error: insertExamErr } = await supabase
      .from('exams')
      .insert({ name: 'SEFAZ-BA', state: 'BA', edition_year: 2022, status: 'ativo' })
      .select('id')
      .single();
    
    if (insertExamErr) throw insertExamErr;
    examId = newExam.id;
  } else {
    examId = existingExam.id;
    console.log('Edital SEFAZ-BA já existe.');
  }

  // 2. Inserir Tópicos
  console.log(`Processando ${topicsData.length} tópicos...`);
  let topicsInserted = 0;
  const topicIdMap = new Map<string, string>(); // Guarda chave 'Disciplina - Assunto' para linkar nas metas

  for (const topic of topicsData) {
    const priority = calculatePriority(topic.recurrence || 0, topic.trend || 'estável', topic.weight || 1);
    
    // Verifica existência
    const { data: existingTopic } = await supabase
      .from('topics')
      .select('id')
      .eq('exam_id', examId)
      .eq('discipline', topic.discipline)
      .eq('topic_name', topic.topic_name)
      .maybeSingle();

    let currentTopicId = '';

    if (!existingTopic) {
      const { data: newTopic, error: topicErr } = await supabase
        .from('topics')
        .insert({
          exam_id: examId,
          discipline: topic.discipline,
          subject: topic.subject || topic.discipline,
          topic_name: topic.topic_name,
          recurrence: topic.recurrence || 0,
          trend: topic.trend || 'estável',
          weight: topic.weight || 1,
          priority,
          summary: topic.summary,
          exam_tips: topic.exam_tips,
          source: topic.source || 'Importação Manual'
        })
        .select('id')
        .single();
      
      if (topicErr) {
        console.error('Erro ao inserir tópico:', topicErr);
        continue;
      }
      currentTopicId = newTopic.id;
      topicsInserted++;
    } else {
      currentTopicId = existingTopic.id;
    }

    // Facilita a vinculação futura pelas metas (Normalização simples de texto)
    const mapKey = `${topic.discipline.toLowerCase().trim()} - ${topic.topic_name.toLowerCase().trim()}`;
    topicIdMap.set(mapKey, currentTopicId);
  }

  // 3. Inserir Semanas, Metas e Materiais
  let weeksInserted = 0;
  let goalsInserted = 0;
  let materialsInserted = 0;
  let unlinkedGoals = 0;

  console.log(`Processando cronograma de ${scheduleData.semanas.length} semanas...`);

  for (const week of scheduleData.semanas) {
    let weekId = '';
    const { data: existingWeek } = await supabase
      .from('weeks')
      .select('id')
      .eq('exam_id', examId)
      .eq('week_number', week.numero)
      .maybeSingle();

    if (!existingWeek) {
      const { data: newWeek, error: weekErr } = await supabase
        .from('weeks')
        .insert({
          exam_id: examId,
          week_number: week.numero,
          title: week.titulo,
          order_index: week.numero
        })
        .select('id')
        .single();
      
      if (weekErr) throw weekErr;
      weekId = newWeek.id;
      weeksInserted++;
    } else {
      weekId = existingWeek.id;
    }

    // Inserir Metas
    let goalOrder = 1;
    for (const goal of week.metas) {
      // Tentativa de Linkar a um Tópico
      const goalKey = `${goal.disciplina.toLowerCase().trim()} - ${goal.assunto.toLowerCase().trim()}`;
      const matchedTopicId = topicIdMap.get(goalKey) || null;
      
      if (!matchedTopicId) unlinkedGoals++;

      let goalId = '';
      const { data: existingGoal } = await supabase
        .from('goals')
        .select('id')
        .eq('week_id', weekId)
        .eq('title', goal.titulo)
        .maybeSingle();

      if (!existingGoal) {
        const { data: newGoal, error: goalErr } = await supabase
          .from('goals')
          .insert({
            week_id: weekId,
            topic_id: matchedTopicId,
            type: goal.tipo || 'teoria',
            title: goal.titulo,
            order_index: goalOrder++
          })
          .select('id')
          .single();
        
        if (goalErr) throw goalErr;
        goalId = newGoal.id;
        goalsInserted++;
      } else {
        goalId = existingGoal.id;
      }

      // Inserir Materiais
      for (const material of goal.materiais) {
        const { data: existingMat } = await supabase
          .from('materials')
          .select('id')
          .eq('goal_id', goalId)
          .eq('title', material.titulo)
          .maybeSingle();

        if (!existingMat) {
          const { error: matErr } = await supabase
            .from('materials')
            .insert({
              goal_id: goalId,
              type: material.tipo,
              title: material.titulo,
              url: material.url || null,
              study_tip: material.dica_estudo || null
            });
          
          if (!matErr) materialsInserted++;
        }
      }
    }
  }

  console.log('\n=== Resumo da Execução ===');
  console.log(`Tópicos inseridos: ${topicsInserted}`);
  console.log(`Semanas inseridas: ${weeksInserted}`);
  console.log(`Metas inseridas: ${goalsInserted}`);
  console.log(`Materiais inseridos: ${materialsInserted}`);
  
  if (unlinkedGoals > 0) {
    console.log(`\n⚠️ Atenção: ${unlinkedGoals} metas não conseguiram ser mapeadas automaticamente para um Tópico. Verifique a nomenclatura (Disciplina - Assunto) nos JSONs.`);
  }

  console.log('\nSeed finalizado com sucesso!');
}

runSeed().catch(console.error);
