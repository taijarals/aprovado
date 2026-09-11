import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const app = express();
const PORT = 3000;

app.use(express.json());

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'aprovado' }
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// API /api/ai/summary
app.post("/api/ai/summary", async (req, res) => {
  try {
    const { materialId, title, studyTip } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Título do material é obrigatório." });
    }

    const prompt = `Atue como um professor especialista em concursos públicos da área fiscal. 
Com base no título do material "${title}" ${studyTip ? `e na dica de estudo "${studyTip}"` : ''}, elabore um resumo didático, objetivo e estruturado em Markdown cobrindo os conceitos essenciais que o concurseiro precisa dominar. Seja direto, profundo e didático.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const summary = response.text || 'Resumo não gerado.';

    // Cache in Supabase if materialId exists
    if (materialId) {
      await supabase
        .from('materials')
        .update({ ai_summary: summary })
        .eq('id', materialId);
    }

    res.json({ summary });
  } catch (err: any) {
    console.error('Erro ao gerar resumo com IA:', err);
    res.status(500).json({ error: err.message || 'Erro ao gerar resumo com IA.' });
  }
});

// API /api/ai/questions
app.post("/api/ai/questions", async (req, res) => {
  try {
    const { examId, topicId, discipline, topicName, summary, examTips, quantity = 5, bancaStyle = 'livre' } = req.body;

    const prompt = `Atue como uma banca examinadora de concursos públicos de alta exigência (como CESPE/CEBRASPE, FGV, FCC). Crie exatamente ${quantity} questões inéditas e originais (NUNCA utilize questões reais de provas anteriores, apenas elabore no estilo da banca ${bancaStyle}).

Contexto do Tópico:
- Disciplina: ${discipline || 'Geral'}
- Tópico: ${topicName || 'Tópico de Estudo'}
- Resumo/Conteúdo: ${summary || 'Não informado'}
- Dicas de Prova: ${examTips || 'Não informado'}

Requisitos estritos de formato:
1. Se a banca for "CESPE", use estritamente o formato de Certo ou Errado (options: {"a": "Certo", "b": "Errado"}, correct_answer: "a" ou "b").
2. Para outras bancas ou "livre", use múltipla escolha com 4 alternativas ("a", "b", "c", "d").
3. Para cada questão, forneça:
   - "statement": Enunciado claro e contextualizado.
   - "question_type": "certo_errado" ou "multipla_escolha".
   - "options": Objeto com chaves "a", "b" (e "c", "d" se múltipla escolha).
   - "correct_answer": A letra correta ("a", "b", etc.).
   - "explanation": Gabarito comentado detalhado.
4. Retorne APENAS um array JSON puro (sem marcação markdown extra se possível, ou dentro de bloco json) contendo as questões.

Exemplo de formato JSON esperado:
[
  {
    "statement": "...",
    "question_type": "certo_errado",
    "options": { "a": "Certo", "b": "Errado" },
    "correct_answer": "a",
    "explanation": "..."
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const textResponse = response.text || '[]';
    const cleanedJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let generatedQuestions = [];
    try {
      generatedQuestions = JSON.parse(cleanedJson);
    } catch (parseErr) {
      console.error('Erro ao fazer parse do JSON do Gemini:', parseErr, cleanedJson);
      return res.status(500).json({ error: 'Erro ao processar as questões geradas pela IA.' });
    }

    if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
      return res.status(500).json({ error: 'A IA não retornou questões válidas.' });
    }

    const source = bancaStyle && bancaStyle !== 'livre' ? 'ia_estilo_banca' : 'ia_nova';
    const bancaValue = bancaStyle && bancaStyle !== 'livre' ? bancaStyle : null;

    const rowsToInsert = generatedQuestions.map((q: any) => ({
      exam_id: examId || null,
      discipline: discipline || 'Geral',
      statement: q.statement,
      question_type: q.question_type || 'multipla_escolha',
      options: q.options || { a: 'A', b: 'B', c: 'C', d: 'D' },
      correct_answer: q.correct_answer || 'a',
      explanation: q.explanation || '',
      source: source,
      banca_style: bancaValue
    }));

    const { data: inserted, error: insErr } = await supabase
      .from('questions')
      .insert(rowsToInsert)
      .select('*');

    if (insErr) throw insErr;

    res.json({ questions: inserted });
  } catch (err: any) {
    console.error('Erro ao gerar questões com IA:', err);
    res.status(500).json({ error: err.message || 'Erro ao gerar questões com IA.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
