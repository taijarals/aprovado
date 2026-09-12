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

function calculatePriority(recurrence: number, tendencia: number, weight: number): number {
  const trendFactor = tendencia >= 7 ? 1.2 : tendencia <= 4 ? 0.8 : 1.0;
  return Number(((recurrence + 1) * weight * trendFactor).toFixed(2));
}

async function runOptimizedSeed() {
  console.log('=== INICIANDO SEED OTIMIZADO (SEFAZ-BA & SEFAZ-AL) ===');

  // 1. Limpar tabelas na ordem correta
  console.log('Limpando tabelas existentes...');
  await supabase.from('question_attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('user_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('materials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('goals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('weeks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('topic_exams').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('topics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('exams').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Tabelas limpas com sucesso.');

  // 2. Ler arquivos JSON
  let topicsData: any[] = [];
  let sharedAlData: any[] = [];
  let exclusiveAlData: any[] = [];
  let scheduleData: any = {};

  try {
    topicsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/topics.json'), 'utf-8'));
    sharedAlData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/topicos_al_compartilhados.json'), 'utf-8'));
    exclusiveAlData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/topicos_al_exclusivos.json'), 'utf-8'));
    scheduleData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/schedule.json'), 'utf-8'));
  } catch (error) {
    console.error('Erro ao ler arquivos JSON em scripts/data/.', error);
    process.exit(1);
  }

  // 3. Criar exames
  const { data: baExam, error: baErr } = await supabase
    .from('exams')
    .insert({ name: 'SEFAZ-BA', state: 'BA', edition_year: 2022, status: 'ativo' })
    .select('id')
    .single();
  if (baErr) throw baErr;
  const baExamId = baExam.id;

  const { data: alExam, error: alErr } = await supabase
    .from('exams')
    .insert({ name: 'SEFAZ-AL', state: 'AL', edition_year: 2026, status: 'ativo' })
    .select('id')
    .single();
  if (alErr) throw alErr;
  const alExamId = alExam.id;

  console.log('Exames criados: SEFAZ-BA e SEFAZ-AL.');

  // 4. Coletar todos os tópicos únicos necessários
  const uniqueTopicsMap = new Map<string, any>(); // key: 'discipline - subject' -> topic object

  topicsData.forEach(t => {
    const discipline = (t.disciplina || '').trim();
    const subject = (t.assunto || '').trim();
    if (!discipline || !subject) return;
    if (t.presente_ba19 === true || t.presente_ba22 === true || t.presente_al26 === true) {
      const key = `${discipline.toLowerCase()} - ${subject.toLowerCase()}`;
      if (!uniqueTopicsMap.has(key)) {
        uniqueTopicsMap.set(key, {
          discipline,
          subject,
          topic_name: subject,
          source: t.fonte_principal || null
        });
      }
    }
  });

  const topicsArray = Array.from(uniqueTopicsMap.values());
  console.log(`Inserindo ${topicsArray.length} tópicos únicos em lotes...`);

  const topicIdMap = new Map<string, string>(); // 'discipline - subject' -> uuid
  for (let i = 0; i < topicsArray.length; i += 100) {
    const chunk = topicsArray.slice(i, i + 100);
    const { data: inserted, error } = await supabase
      .from('topics')
      .insert(chunk)
      .select('id, discipline, subject');

    if (error) {
      console.error('Erro ao inserir lote de tópicos:', error);
      throw error;
    }

    if (inserted) {
      inserted.forEach(t => {
        topicIdMap.set(`${t.discipline.trim().toLowerCase()} - ${t.subject.trim().toLowerCase()}`, t.id);
      });
    }
  }
  console.log(`Tópicos inseridos com sucesso. Mapeados: ${topicIdMap.size}`);

  // 5. Inserir Topic_Exams para SEFAZ-BA
  const baTopics = topicsData.filter(t => t.presente_ba19 === true || t.presente_ba22 === true);
  const baTopicExams = [];
  for (const t of baTopics) {
    const discipline = (t.disciplina || '').trim();
    const subject = (t.assunto || '').trim();
    const key = `${discipline.toLowerCase()} - ${subject.toLowerCase()}`;
    const topicId = topicIdMap.get(key);
    if (!topicId) continue;

    const recurrence = Math.round(Number(t.recorrencia_0_10) || 0);
    const tendencia = t.tendencia_0_10 || 5;
    const trendStr = tendencia >= 7 ? 'crescente' : tendencia <= 4 ? 'decrescente' : 'estável';
    const weight = t.peso_0_10 || 1;
    const priority = calculatePriority(recurrence, tendencia, weight);

    baTopicExams.push({
      topic_id: topicId,
      exam_id: baExamId,
      recurrence,
      trend: trendStr,
      weight,
      priority
    });
  }

  console.log(`Inserindo ${baTopicExams.length} relações topic_exams para SEFAZ-BA...`);
  for (let i = 0; i < baTopicExams.length; i += 100) {
    const chunk = baTopicExams.slice(i, i + 100);
    const { error } = await supabase.from('topic_exams').insert(chunk);
    if (error) {
      console.error('Erro ao inserir topic_exams BA:', error);
      throw error;
    }
  }

  // 6. Inserir Topic_Exams para SEFAZ-AL (Compartilhados + Exclusivos)
  const alTopicExams = [];
  const allAlTopics = [...sharedAlData, ...exclusiveAlData];
  for (const t of allAlTopics) {
    const discipline = (t.disciplina || '').trim();
    const subject = (t.assunto || '').trim();
    const key = `${discipline.toLowerCase()} - ${subject.toLowerCase()}`;
    const topicId = topicIdMap.get(key);
    if (!topicId) continue;

    const recurrence = Math.round(Number(t.recorrencia_0_10) || 0);
    const tendencia = t.tendencia_0_10 || 5;
    const trendStr = tendencia >= 7 ? 'crescente' : tendencia <= 4 ? 'decrescente' : 'estável';
    const weight = t.peso_0_10 || 5;
    const priority = calculatePriority(recurrence, tendencia, weight);
    const itemsCount = t.itens_al26_disciplina || null;
    const isDiscursive = t.discursiva_al26 === true || t.discursiva_al26 === 'Sim';

    alTopicExams.push({
      topic_id: topicId,
      exam_id: alExamId,
      recurrence,
      trend: trendStr,
      weight,
      priority,
      items_count: itemsCount,
      is_discursive: isDiscursive
    });
  }

  console.log(`Inserindo ${alTopicExams.length} relações topic_exams para SEFAZ-AL...`);
  for (let i = 0; i < alTopicExams.length; i += 100) {
    const chunk = alTopicExams.slice(i, i + 100);
    const { error } = await supabase.from('topic_exams').insert(chunk);
    if (error) {
      console.error('Erro ao inserir topic_exams AL:', error);
      throw error;
    }
  }

  // 7. Inserir Cronograma (Semanas, Metas, Materiais) para SEFAZ-BA
  const weeksList = scheduleData.weeks || [];
  const goalsList = scheduleData.goals || [];
  const materialsList = scheduleData.materials || [];

  console.log(`Inserindo ${weeksList.length} semanas...`);
  const weekIdMap = new Map<number, string>();
  for (const w of weeksList) {
    const { data: newWk, error: wkErr } = await supabase
      .from('weeks')
      .insert({
        exam_id: baExamId,
        week_number: w.number,
        title: w.title || `Semana ${w.number}`,
        order_index: w.number
      })
      .select('id')
      .single();

    if (wkErr) throw wkErr;
    weekIdMap.set(w.id, newWk.id);
  }

  console.log(`Inserindo ${goalsList.length} metas...`);
  const goalUuidMap = new Map<number, string>();
  const goalsChunk = goalsList.map((g: any) => {
    const parentWeekUuid = weekIdMap.get(g.weekId);
    const discipline = (g.discipline || '').trim();
    const subject = (g.subject || '').trim();
    const lookupKey = `${discipline.toLowerCase()} - ${subject.toLowerCase()}`;
    const matchedTopicId = topicIdMap.get(lookupKey) || null;

    return {
      originalId: g.id,
      week_id: parentWeekUuid,
      topic_id: matchedTopicId,
      type: g.type || 'teoria',
      title: `${g.discipline} - ${g.subject}`,
      order_index: g.number || 1
    };
  }).filter((g: any) => g.week_id);

  for (let i = 0; i < goalsChunk.length; i += 100) {
    const chunk = goalsChunk.slice(i, i + 100);
    const payload = chunk.map(({ originalId, ...rest }: any) => rest);
    const { data: insertedGoals, error: gErr } = await supabase
      .from('goals')
      .insert(payload)
      .select('id');

    if (gErr) {
      console.error('Erro ao inserir metas:', gErr);
      throw gErr;
    }

    if (insertedGoals) {
      insertedGoals.forEach((ig, idx) => {
        goalUuidMap.set(chunk[idx].originalId, ig.id);
      });
    }
  }

  console.log(`Inserindo ${materialsList.length} materiais...`);
  const materialsChunk = materialsList.map((m: any) => {
    const parentGoalUuid = goalUuidMap.get(m.goalId);
    const correspondingGoal = goalsList.find((g: any) => g.id === m.goalId);
    const studyTip = correspondingGoal?.studyTip || null;

    if (!parentGoalUuid) return null;
    let matType = m.type || 'pdf';
    if (matType === 'videoaula' || matType === 'tarefa') {
      matType = 'pdf';
    }

    return {
      goal_id: parentGoalUuid,
      type: matType,
      title: m.description || 'Material',
      url: m.link || null,
      study_tip: studyTip
    };
  }).filter(Boolean);

  for (let i = 0; i < materialsChunk.length; i += 100) {
    const chunk = materialsChunk.slice(i, i + 100);
    const { error: matErr } = await supabase.from('materials').insert(chunk);
    if (matErr) {
      console.error('Erro ao inserir materiais:', matErr);
    }
  }

  console.log('\n========================================');
  console.log('RESUMO FINAL DO SEED OTIMIZADO:');
  console.log(`- Tópicos totais criados: ${topicsArray.length}`);
  console.log(`- Topic-Exams SEFAZ-BA: ${baTopicExams.length}`);
  console.log(`- Topic-Exams SEFAZ-AL: ${alTopicExams.length}`);
  console.log(`- Semanas inseridas: ${weeksList.length}`);
  console.log(`- Metas inseridas: ${goalsChunk.length}`);
  console.log(`- Materiais inseridos: ${materialsChunk.length}`);
  console.log('========================================\n');
  console.log('Seed otimizado executado com sucesso!');
}

runOptimizedSeed().catch(err => {
  console.error('Erro fatal no seed:', err);
  process.exit(1);
});
