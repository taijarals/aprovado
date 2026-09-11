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

async function runAlSeed() {
  console.log('Iniciando o Seed do SEFAZ-AL (Schema Aprovado)...');

  let topicsData: any[] = [];
  try {
    topicsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/topics.json'), 'utf-8'));
  } catch (error) {
    console.error('Erro ao ler topics.json');
    process.exit(1);
  }

  const alTopics = topicsData.filter(t => t.presente_al26 === true);
  console.log(`Encontrados ${alTopics.length} tópicos com presente_al26 = true no dataset.`);

  // 1. Criar ou buscar Exame SEFAZ-AL (2026, Estado AL)
  let examId = '';
  const { data: existingExam, error: examFetchErr } = await supabase
    .from('exams')
    .select('id')
    .eq('name', 'SEFAZ-AL')
    .maybeSingle();

  if (examFetchErr) {
    console.error('Erro ao buscar exame SEFAZ-AL:', examFetchErr);
    return;
  }

  if (!existingExam) {
    console.log('Criando edital SEFAZ-AL (2026)...');
    const { data: newExam, error: examErr } = await supabase
      .from('exams')
      .insert({ name: 'SEFAZ-AL', state: 'AL', edition_year: 2026, status: 'ativo' })
      .select('id')
      .single();
    if (examErr) {
      console.error('Erro ao criar exame SEFAZ-AL:', examErr);
      return;
    }
    examId = newExam.id;
  } else {
    examId = existingExam.id;
    console.log('Edital SEFAZ-AL já cadastrado.');
  }

  let sharedCount = 0; // Tópicos já existentes no BD (compartilhados BA+AL)
  let newTopicsCount = 0; // Tópicos criados do zero (exclusivos do AL)
  let topicExamsCreated = 0;

  for (const t of alTopics) {
    const discipline = t.disciplina.trim();
    const subject = t.assunto.trim();

    // Verificar se o tópico já existe em 'topics' (disciplina + assunto)
    let { data: existingTopic } = await supabase
      .from('topics')
      .select('id')
      .eq('discipline', discipline)
      .eq('subject', subject)
      .maybeSingle();

    let topicId = '';

    if (!existingTopic) {
      // Criar novo tópico (exclusivo AL), summary e exam_tips como null
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
        console.error(`Erro ao inserir tópico exclusivo AL (${discipline} - ${subject}):`, topErr);
        continue;
      }
      topicId = newTop.id;
      newTopicsCount++;
    } else {
      topicId = existingTopic.id;
      sharedCount++;
    }

    // Inserir ou atualizar em topic_exams para SEFAZ-AL
    // Valores neutros / provisórios até termos dados reais de prova do AL
    // Fórmula de prioridade provisória: (recurrence + 1) * weight * trendFactor => (0 + 1) * weight * 1.0 = weight
    const recurrence = 0;
    const trend = 'novo';
    const weight = t.peso_0_10 || 5;
    const priority = Number(((recurrence + 1) * weight * 1.0).toFixed(2));
    const itemsCount = t.itens_al26_disciplina || null;
    const isDiscursive = t.discursiva_al26 || false;

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
          trend,
          weight,
          priority,
          items_count: itemsCount,
          is_discursive: isDiscursive
        });
      if (relErr) {
        console.error(`Erro ao criar relação topic_exams para AL:`, relErr);
      } else {
        topicExamsCreated++;
      }
    } else {
      await supabase
        .from('topic_exams')
        .update({
          recurrence,
          trend,
          weight,
          priority,
          items_count: itemsCount,
          is_discursive: isDiscursive
        })
        .eq('topic_id', topicId)
        .eq('exam_id', examId);
    }
  }

  console.log('\n========================================');
  console.log('RESUMO DA IMPORTAÇÃO SEFAZ-AL:');
  console.log(`- Total de tópicos no edital AL: ${alTopics.length}`);
  console.log(`- Tópicos compartilhados (já existiam no BA / Fase 3): ${sharedCount} (Esperado: 225)`);
  console.log(`- Tópicos novos criados (exclusivos do AL): ${newTopicsCount} (Esperado: 166)`);
  console.log(`- Relações topic_exams criadas: ${topicExamsCreated}`);
  console.log('========================================\n');
}

runAlSeed().catch(console.error);
