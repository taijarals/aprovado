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

async function seedSefazBaFull() {
  console.log('=== INICIANDO SEED COMPLETO SEFAZ-BA (Otimizado) ===');

  let topicsData: any[] = [];
  let scheduleData: any;

  try {
    topicsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/topics.json'), 'utf-8'));
  } catch (err) {
    console.error('Erro ao ler topics.json:', err);
    process.exit(1);
  }

  try {
    scheduleData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/cronograma_ba_16_semanas.json'), 'utf-8'));
  } catch (err) {
    console.error('Erro ao ler cronograma_ba_16_semanas.json:', err);
    process.exit(1);
  }

  // 1. Exame SEFAZ-BA
  let examId = '';
  const { data: existingExam } = await supabase
    .from('exams')
    .select('id')
    .eq('name', 'SEFAZ-BA')
    .maybeSingle();

  if (!existingExam) {
    console.log('Criando edital SEFAZ-BA (2022)...');
    const { data: newExam, error: examErr } = await supabase
      .from('exams')
      .insert({ name: 'SEFAZ-BA', state: 'BA', edition_year: 2022, status: 'ativo' })
      .select('id')
      .single();
    if (examErr) {
      console.error('Erro ao criar exame:', examErr);
      process.exit(1);
    }
    examId = newExam.id;
  } else {
    examId = existingExam.id;
    console.log('Edital SEFAZ-BA encontrado (ID:', examId, ')');
  }

  // 2. Tópicos presentes em BA19 ou BA22
  const baTopics = topicsData.filter(t => t.presente_ba19 === true || t.presente_ba22 === true);
  console.log(`Processando ${baTopics.length} tópicos para SEFAZ-BA...`);

  // Buscar todos os tópicos existentes no banco para evitar queries unitárias
  const { data: allDbTopics } = await supabase.from('topics').select('id, discipline, subject');
  const topicMap = new Map<string, string>(); // "discipline - subject" -> id
  (allDbTopics || []).forEach(t => {
    topicMap.set(`${t.discipline.trim().toLowerCase()} - ${t.subject.trim().toLowerCase()}`, t.id);
  });

  let topicsCreated = 0;
  let topicExamsProcessed = 0;

  for (const t of baTopics) {
    const discipline = (t.disciplina || '').trim();
    const subject = (t.assunto || '').trim();
    if (!discipline || !subject) continue;

    const key = `${discipline.toLowerCase()} - ${subject.toLowerCase()}`;
    let topicId = topicMap.get(key);

    if (!topicId) {
      const { data: newTop, error: topErr } = await supabase
        .from('topics')
        .insert({
          discipline,
          subject,
          topic_name: subject,
          summary: null,
          exam_tips: null,
          source: t.fonte_principal || null
        })
        .select('id')
        .single();

      if (topErr) {
        // Tentar buscar se houve conflito de concorrência
        const { data: retryTop } = await supabase
          .from('topics')
          .select('id')
          .eq('discipline', discipline)
          .eq('subject', subject)
          .maybeSingle();
        if (retryTop) {
          topicId = retryTop.id;
        } else {
          console.error(`Erro ao inserir tópico ${discipline} - ${subject}:`, topErr);
          continue;
        }
      } else {
        topicId = newTop.id;
        topicsCreated++;
      }
      topicMap.set(key, topicId);
    }

    // Prioridade Racional:
    // Fórmula: (tendencia * 0.3 + recorrencia * 0.4 + peso_normalizado * 0.3) * 10
    // Onde peso_normalizado normaliza escala 0-5 para 0-10 se necessário.
    const tendencia = t.tendencia_0_10 || 5;
    const recurrence = t.recorrencia_0_10 || 5;
    const rawPeso = t.peso_0_10 || 5;
    const pesoNorm = rawPeso > 5 ? rawPeso : rawPeso * 2;
    const priority = Number(((((tendencia * 0.3) + (recurrence * 0.4) + (pesoNorm * 0.3))) * 10).toFixed(2));

    // Upsert topic_exams
    const { data: existingRel } = await supabase
      .from('topic_exams')
      .select('id')
      .eq('topic_id', topicId)
      .eq('exam_id', examId)
      .maybeSingle();

    if (!existingRel) {
      await supabase.from('topic_exams').insert({
        topic_id: topicId,
        exam_id: examId,
        recurrence,
        trend: String(tendencia),
        weight: rawPeso,
        priority,
        items_count: null,
        is_discursive: null
      });
    } else {
      await supabase.from('topic_exams').update({
        recurrence,
        trend: String(tendencia),
        weight: rawPeso,
        priority
      }).eq('id', existingRel.id);
    }
    topicExamsProcessed++;
  }

  console.log(`Tópicos: ${topicsCreated} novos criados (Total no mapa: ${topicMap.size}), Topic-Exams processados: ${topicExamsProcessed}.`);

  // 3. Cronograma (Semanas, Metas, Materiais)
  const weeksList = scheduleData.weeks || [];
  const goalsList = scheduleData.goals || [];
  const materialsList = scheduleData.materials || [];

  let weeksCount = 0;
  let goalsCount = 0;
  let materialsCount = 0;
  const unlinkedGoals: string[] = [];

  const weekIdMap = new Map<number, string>();
  const goalIdMap = new Map<number, string>();

  for (const w of weeksList) {
    let { data: wk } = await supabase
      .from('weeks')
      .select('id')
      .eq('exam_id', examId)
      .eq('week_number', w.number)
      .maybeSingle();

    let weekUUID = '';
    if (!wk) {
      const { data: newWk, error: wkErr } = await supabase
        .from('weeks')
        .insert({
          exam_id: examId,
          week_number: w.number,
          title: w.title || `Semana ${w.number}`,
          order_index: w.number
        })
        .select('id')
        .single();
      if (wkErr) {
        console.error(`Erro ao criar semana ${w.number}:`, wkErr);
        continue;
      }
      weekUUID = newWk.id;
      weeksCount++;
    } else {
      weekUUID = wk.id;
    }
    weekIdMap.set(w.id, weekUUID);
  }

  for (const g of goalsList) {
    const weekUUID = weekIdMap.get(g.weekId);
    if (!weekUUID) continue;

    const disc = (g.discipline || '').trim();
    const subj = (g.subject || '').trim();
    const lookupKey = `${disc.toLowerCase()} - ${subj.toLowerCase()}`;
    const topicId = topicMap.get(lookupKey) || null;

    if (!topicId) {
      unlinkedGoals.push(`${disc} - ${subj}`);
    }

    const goalTitle = `${disc} - ${subj}`;
    const goalType = g.type === 'revisao' ? 'revisao' : 'teoria';

    let { data: existingGoal } = await supabase
      .from('goals')
      .select('id, topic_id')
      .eq('week_id', weekUUID)
      .eq('title', goalTitle)
      .maybeSingle();

    let goalUUID = '';
    if (!existingGoal) {
      const { data: newG, error: gErr } = await supabase
        .from('goals')
        .insert({
          week_id: weekUUID,
          topic_id: topicId,
          type: goalType,
          title: goalTitle,
          order_index: g.number || 1
        })
        .select('id')
        .single();

      if (gErr) {
        console.error(`Erro ao inserir meta ${goalTitle}:`, gErr);
        continue;
      }
      goalUUID = newG.id;
      goalsCount++;
    } else {
      goalUUID = existingGoal.id;
      if (topicId && !existingGoal.topic_id) {
        await supabase.from('goals').update({ topic_id: topicId }).eq('id', goalUUID);
      }
    }
    goalIdMap.set(g.id, goalUUID);
  }

  for (const m of materialsList) {
    const goalUUID = goalIdMap.get(m.goalId);
    if (!goalUUID) continue;

    const matType = ['videoaula', 'pdf', 'questoes', 'tarefa'].includes(m.type) ? m.type : 'pdf';
    const matTitle = m.description || m.title || 'Material de Estudo';
    const matUrl = m.link || m.url || 'https://www.grancursosonline.com.br';

    let { data: existingMat } = await supabase
      .from('materials')
      .select('id')
      .eq('goal_id', goalUUID)
      .eq('title', matTitle)
      .maybeSingle();

    if (!existingMat) {
      const { error: mErr } = await supabase
        .from('materials')
        .insert({
          goal_id: goalUUID,
          type: matType,
          title: matTitle,
          url: matUrl,
          study_tip: null
        });
      if (!mErr) materialsCount++;
    } else {
      await supabase.from('materials').update({ url: matUrl }).eq('id', existingMat.id);
    }
  }

  console.log('\n================ RESUMO DO SEED SEFAZ-BA ================');
  console.log(`- Tópicos totais mapeados/criados: ${topicMap.size} (${topicsCreated} novos)`);
  console.log(`- Relações Topic-Exams processadas: ${topicExamsProcessed}`);
  console.log(`- Semanas inseridas/verificadas: ${weeksList.length} (${weeksCount} novas)`);
  console.log(`- Metas inseridas/verificadas: ${goalsList.length} (${goalsCount} novas)`);
  console.log(`- Materiais inseridos/verificados: ${materialsList.length} (${materialsCount} novos)`);
  console.log(`- Metas não linkadas exatamente a tópicos: ${unlinkedGoals.length}`);
  if (unlinkedGoals.length > 0) {
    console.log('  Exemplos de metas sem link de tópico:', unlinkedGoals.slice(0, 5));
  }
  console.log('===========================================================');
}

seedSefazBaFull().catch(console.error);
