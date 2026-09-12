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

async function resetAndSeed() {
  console.log('--- RESETANDO E REPOPULANDO BANCO DE DADOS (SEFAZ-BA & SEFAZ-AL) ---');

  // 1. Limpar tabelas na ordem correta
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

  let topicsData: any[] = [];
  try {
    topicsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/topics.json'), 'utf-8'));
  } catch (error) {
    console.error('Erro ao ler topics.json');
    process.exit(1);
  }

  // 2. Criar Exame SEFAZ-BA (2022)
  const { data: baExam, error: baExamErr } = await supabase
    .from('exams')
    .insert({ name: 'SEFAZ-BA', state: 'BA', edition_year: 2022, status: 'ativo' })
    .select('id')
    .single();
  if (baExamErr) throw baExamErr;
  const baExamId = baExam.id;
  console.log('Criado Edital SEFAZ-BA (2022)');

  // Inserir Tópicos SEFAZ-BA (presente_ba19 || presente_ba22)
  const baTopics = topicsData.filter(t => t.presente_ba19 === true || t.presente_ba22 === true);
  for (const t of baTopics) {
    const discipline = t.disciplina.trim();
    const subject = t.assunto.trim();

    let { data: top } = await supabase
      .from('topics')
      .insert({
        discipline,
        subject,
        topic_name: subject,
        source: t.fonte_principal || null
      })
      .select('id')
      .single();

    if (top) {
      const recurrence = t.recorrencia_0_10 || 0;
      const tendencia = t.tendencia_0_10 || 5;
      const trendStr = tendencia >= 7 ? 'crescente' : tendencia <= 4 ? 'decrescente' : 'estável';
      const weight = t.peso_0_10 || 5;
      const priority = calculatePriority(recurrence, tendencia, weight);

      await supabase.from('topic_exams').insert({
        topic_id: top.id,
        exam_id: baExamId,
        recurrence,
        trend: trendStr,
        weight,
        priority
      });
    }
  }
  console.log(`SEFAZ-BA populada com ${baTopics.length} tópicos.`);

  // 3. Criar Exame SEFAZ-AL (2026, Auditor Fiscal da Receita Estadual, CESPE / CEBRASPE)
  const { data: alExam, error: alExamErr } = await supabase
    .from('exams')
    .insert({ name: 'SEFAZ-AL', state: 'AL', edition_year: 2026, status: 'ativo' })
    .select('id')
    .single();
  if (alExamErr) throw alExamErr;
  const alExamId = alExam.id;
  console.log('Criado Edital SEFAZ-AL (2026) - Auditor Fiscal da Receita Estadual (CESPE / CEBRASPE)');

  const alTopics = topicsData.filter(t => t.presente_al26 === true);
  const sharedTopics = alTopics.filter(t => t.presente_ba19 === true || t.presente_ba22 === true);
  const exclusiveTopics = alTopics.filter(t => !t.presente_ba19 && !t.presente_ba22);

  let sharedFoundCount = 0;
  const notFoundShared: string[] = [];
  let topicExamsSharedCount = 0;

  for (const t of sharedTopics) {
    const discipline = t.disciplina.trim();
    const subject = t.assunto.trim();

    const { data: existingTopic } = await supabase
      .from('topics')
      .select('id')
      .eq('discipline', discipline)
      .eq('subject', subject)
      .maybeSingle();

    if (!existingTopic) {
      notFoundShared.push(`${discipline} - ${subject}`);
      continue;
    }

    sharedFoundCount++;
    const topicId = existingTopic.id;

    const recurrence = t.recorrencia_0_10 || 0;
    const tendencia = t.tendencia_0_10 || 5;
    const trendStr = tendencia >= 7 ? 'crescente' : tendencia <= 4 ? 'decrescente' : 'estável';
    const weight = t.peso_0_10 || 5;
    const priority = calculatePriority(recurrence, tendencia, weight);
    const itemsCount = t.itens_al26_disciplina || null;
    const isDiscursive = t.discursiva_al26 || false;

    const { error: relErr } = await supabase
      .from('topic_exams')
      .insert({
        topic_id: topicId,
        exam_id: alExamId,
        recurrence,
        trend: trendStr,
        weight,
        priority,
        items_count: itemsCount,
        is_discursive: isDiscursive
      });

    if (!relErr) topicExamsSharedCount++;
  }

  let newTopicsCreatedCount = 0;
  let topicExamsExclusiveCount = 0;

  for (const t of exclusiveTopics) {
    const discipline = t.disciplina.trim();
    const subject = t.assunto.trim();

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
      console.error(`Erro ao criar tópico exclusivo AL (${discipline} - ${subject}):`, topErr);
      continue;
    }

    const topicId = newTop.id;
    newTopicsCreatedCount++;

    const recurrence = t.recorrencia_0_10 || 0;
    const tendencia = t.tendencia_0_10 || 5;
    const trendStr = tendencia >= 7 ? 'crescente' : tendencia <= 4 ? 'decrescente' : 'estável';
    const weight = t.peso_0_10 || 5;
    const priority = calculatePriority(recurrence, tendencia, weight);
    const itemsCount = t.itens_al26_disciplina || null;
    const isDiscursive = t.discursiva_al26 || false;

    const { error: relErr } = await supabase
      .from('topic_exams')
      .insert({
        topic_id: topicId,
        exam_id: alExamId,
        recurrence,
        trend: trendStr,
        weight,
        priority,
        items_count: itemsCount,
        is_discursive: isDiscursive
      });

    if (!relErr) topicExamsExclusiveCount++;
  }

  const totalTopicExams = topicExamsSharedCount + topicExamsExclusiveCount;

  console.log('\n========================================');
  console.log('RESUMO DA IMPORTAÇÃO SEFAZ-AL:');
  console.log(`- Tópicos novos criados (exclusivos do AL): ${newTopicsCreatedCount} (Esperado: 166)`);
  console.log(`- Tópicos compartilhados encontrados e vinculados: ${topicExamsSharedCount} (Esperado: 225)`);
  console.log(`- Tópicos compartilhados NÃO encontrados: ${notFoundShared.length}`);
  if (notFoundShared.length > 0) {
    console.log('  Lista de não encontrados:', notFoundShared);
  }
  console.log(`- Total de topic_exams criados para o SEFAZ-AL: ${totalTopicExams} (Esperado: 391)`);
  console.log('========================================\n');
}

resetAndSeed().catch(console.error);
