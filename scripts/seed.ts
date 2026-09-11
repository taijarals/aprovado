import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERRO: Faltam VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'aprovado' }
});

// Fórmula de Prioridade: (Recorrência + 1) * Peso * Fator de Tendência
// Onde tendência 0-10 é mapeada para fator: >=7 (crescente: 1.2), <=4 (decrescente: 0.8), senão 1.0
function calculatePriority(recurrence: number, tendencia: number, weight: number): number {
  const trendFactor = tendencia >= 7 ? 1.2 : tendencia <= 4 ? 0.8 : 1.0;
  return Number(((recurrence + 1) * weight * trendFactor).toFixed(2));
}

async function runSeed() {
  console.log('Iniciando o Seed do Banco de Dados (Schema Aprovado - Modelo Novo)...');

  let topicsData: any[] = [];
  let scheduleData: any = {};

  try {
    topicsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/topics.json'), 'utf-8'));
    scheduleData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/schedule.json'), 'utf-8'));
  } catch (error) {
    console.error('Erro ao ler arquivos JSON em scripts/data/. Verifique se existem e estão populados.');
    process.exit(1);
  }

  // 1. Criar ou buscar Exame SEFAZ-BA (2022)
  let examId = '';
  const { data: existingExam } = await supabase
    .from('exams')
    .select('id')
    .eq('name', 'SEFAZ-BA')
    .single();

  if (!existingExam) {
    console.log('Criando edital SEFAZ-BA (2022)...');
    const { data: newExam, error: examErr } = await supabase
      .from('exams')
      .insert({ name: 'SEFAZ-BA', state: 'BA', edition_year: 2022, status: 'ativo' })
      .select('id')
      .single();
    if (examErr) throw examErr;
    examId = newExam.id;
  } else {
    examId = existingExam.id;
    console.log('Edital SEFAZ-BA já cadastrado.');
  }

  // 2. Filtrar e Inserir Tópicos e Topic_Exams para SEFAZ-BA
  // Apenas tópicos onde presente_ba19 ou presente_ba22 é true
  const baTopics = topicsData.filter(t => t.presente_ba19 === true || t.presente_ba22 === true);
  console.log(`Processando ${baTopics.length} tópicos relevantes para SEFAZ-BA...`);

  let topicsInsertedOrUpdated = 0;
  let topicExamsInserted = 0;
  const topicIdMap = new Map<string, string>(); // Chave: 'disciplina - assunto' -> topic_id

  for (const t of baTopics) {
    const discipline = t.disciplina.trim();
    const subject = t.assunto.trim();

    // Upsert em topics (por discipline + subject)
    let { data: existingTopic } = await supabase
      .from('topics')
      .select('id')
      .eq('discipline', discipline)
      .eq('subject', subject)
      .maybeSingle();

    let topicId = '';

    if (!existingTopic) {
      const { data: newTop, error: topErr } = await supabase
        .from('topics')
        .insert({
          discipline,
          subject,
          topic_name: subject,
          source: t.fonte_principal || null
        })
        .select('id')
        .single();

      if (topErr) {
        console.error('Erro ao inserir tópico:', topErr);
        continue;
      }
      topicId = newTop.id;
      topicsInsertedOrUpdated++;
    } else {
      topicId = existingTopic.id;
    }

    topicIdMap.set(`${discipline.toLowerCase()} - ${subject.toLowerCase()}`, topicId);

    // Inserir ou atualizar em topic_exams para SEFAZ-BA
    const recurrence = t.recorrencia_0_10 || 0;
    const tendencia = t.tendencia_0_10 || 5;
    const trendStr = tendencia >= 7 ? 'crescente' : tendencia <= 4 ? 'decrescente' : 'estável';
    const weight = t.peso_0_10 || 1;
    const priority = calculatePriority(recurrence, tendencia, weight);

    const { data: existingRel } = await supabase
      .from('topic_exams')
      .select('id')
      .eq('topic_id', topicId)
      .eq('exam_id', examId)
      .maybeSingle();

    if (!existingRel) {
      const { error: relErr } = await supabase
        .from('topic_exams')
        .insert({
          topic_id: topicId,
          exam_id: examId,
          recurrence,
          trend: trendStr,
          weight,
          priority,
          items_count: null,
          is_discursive: false
        });
      if (!relErr) topicExamsInserted++;
    } else {
      await supabase
        .from('topic_exams')
        .update({
          recurrence,
          trend: trendStr,
          weight,
          priority
        })
        .eq('topic_id', topicId)
        .eq('exam_id', examId);
    }
  }

  // 3. Inserir Semanas, Metas e Materiais
  let weeksInserted = 0;
  let goalsInserted = 0;
  let materialsInserted = 0;
  let unlinkedGoals = 0;

  const weeksList = scheduleData.weeks || [];
  const goalsList = scheduleData.goals || [];
  const materialsList = scheduleData.materials || [];

  console.log(`Processando cronograma: ${weeksList.length} semanas, ${goalsList.length} metas e ${materialsList.length} materiais...`);

  // Inserir Semanas
  const weekIdMap = new Map<number, string>(); // week.id (numérico do json) -> uuid do banco
  for (const w of weeksList) {
    const { data: existingWeek } = await supabase
      .from('weeks')
      .select('id')
      .eq('exam_id', examId)
      .eq('week_number', w.number)
      .maybeSingle();

    let wkId = '';
    if (!existingWeek) {
      const { data: newWk, error: wkErr } = await supabase
        .from('weeks')
        .insert({
          exam_id: examId,
          week_number: w.number,
          title: w.title,
          order_index: w.number
        })
        .select('id')
        .single();
      if (wkErr) throw wkErr;
      wkId = newWk.id;
      weeksInserted++;
    } else {
      wkId = existingWeek.id;
    }
    weekIdMap.set(w.id, wkId);
  }

  // Mapeia goal.id antigo -> goal_id novo
  const goalUuidMap = new Map<number, string>();

  for (const g of goalsList) {
    const parentWeekUuid = weekIdMap.get(g.weekId);
    if (!parentWeekUuid) continue;

    const discipline = (g.discipline || '').trim();
    const subject = (g.subject || '').trim();
    const lookupKey = `${discipline.toLowerCase()} - ${subject.toLowerCase()}`;
    const matchedTopicId = topicIdMap.get(lookupKey) || null;

    if (!matchedTopicId) unlinkedGoals++;

    const { data: existingGoal } = await supabase
      .from('goals')
      .select('id')
      .eq('week_id', parentWeekUuid)
      .eq('title', `${g.discipline} - ${g.subject}`)
      .maybeSingle();

    let gId = '';
    if (!existingGoal) {
      const { data: newGoal, error: gErr } = await supabase
        .from('goals')
        .insert({
          week_id: parentWeekUuid,
          topic_id: matchedTopicId,
          type: g.type || 'teoria',
          title: `${g.discipline} - ${g.subject}`,
          order_index: g.number || 1
        })
        .select('id')
        .single();

      if (gErr) {
        console.error('Erro ao inserir meta:', gErr);
        continue;
      }
      gId = newGoal.id;
      goalsInserted++;
    } else {
      gId = existingGoal.id;
    }
    goalUuidMap.set(g.id, gId);
  }

  // Inserir Materiais
  for (const m of materialsList) {
    const parentGoalUuid = goalUuidMap.get(m.goalId);
    if (!parentGoalUuid) continue;

    const { data: existingMat } = await supabase
      .from('materials')
      .select('id')
      .eq('goal_id', parentGoalUuid)
      .eq('title', m.description)
      .maybeSingle();

    if (!existingMat) {
      // Tenta extrair studyTip do goal correspondente se houver
      const correspondingGoal = goalsList.find((g: any) => g.id === m.goalId);
      const studyTip = correspondingGoal?.studyTip || null;

      const { error: matErr } = await supabase
        .from('materials')
        .insert({
          goal_id: parentGoalUuid,
          type: m.type,
          title: m.description,
          url: m.link || null,
          study_tip: studyTip
        });
      if (!matErr) materialsInserted++;
    }
  }

  console.log('\n=== Resumo da Execução (Seed SEFAZ-BA) ===');
  console.log(`Tópicos (topics) processados/inseridos: ${topicsInsertedOrUpdated}`);
  console.log(`Relações edital-tópico (topic_exams): ${topicExamsInserted}`);
  console.log(`Semanas inseridas: ${weeksInserted}`);
  console.log(`Metas inseridas: ${goalsInserted}`);
  console.log(`Materiais inseridos: ${materialsInserted}`);
  
  if (unlinkedGoals > 0) {
    console.log(`\n⚠️ Atenção: ${unlinkedGoals} metas não conseguiram ser mapeadas automaticamente para um Tópico por nome de Disciplina/Assunto.`);
  }

  console.log('\nSeed finalizado com sucesso!');
}

runSeed().catch(console.error);
