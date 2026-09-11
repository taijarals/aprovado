import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useExam } from '../contexts/ExamContext';
import { supabase } from '../lib/supabase';
import { 
  CheckSquare, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  BarChart2, 
  Award, 
  RefreshCw,
  ChevronRight
} from 'lucide-react';

interface Question {
  id: string;
  discipline: string;
  statement: string;
  question_type: 'certo_errado' | 'multipla_escolha';
  options: { a?: string; b?: string; c?: string; d?: string; e?: string } | null;
  correct_answer: string;
  explanation: string | null;
  source: string;
  banca_style: string | null;
}

interface Attempt {
  id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  attempted_at: string;
  questions?: Question;
}

export default function Questoes() {
  const { user } = useAuth();
  const { selectedExam } = useExam();

  const [activeTab, setActiveTab] = useState<'resolver' | 'estatisticas'>('resolver');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedExam && user) {
      loadQuestionsAndAttempts();
    }
  }, [selectedExam, user]);

  const loadQuestionsAndAttempts = async () => {
    if (!selectedExam || !user) return;
    try {
      setLoading(true);

      // 1. Fetch questions for selected exam
      let { data: qData, error: qErr } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', selectedExam.id);

      if (qErr) throw qErr;

      // If no questions in DB yet, seed some sample questions for testing
      if (!qData || qData.length === 0) {
        const sampleQuestions = [
          {
            exam_id: selectedExam.id,
            discipline: 'Direito Tributário',
            statement: 'A competência tributária é indelegável, podendo, no entanto, a capacidade tributária ativa ser atribuída a outra pessoa jurídica de direito público.',
            question_type: 'certo_errado',
            options: { a: 'Certo', b: 'Errado' },
            correct_answer: 'a',
            explanation: 'Correto. Segundo o art. 7º do CTN, a competência tributária é indelegável. Contudo, a capacidade tributária ativa (arrecadar, fiscalizar, cobrar) pode ser delegada.',
            source: 'ia_estilo_banca',
            banca_style: 'CESPE/CEBRASPE'
          },
          {
            exam_id: selectedExam.id,
            discipline: 'Contabilidade Geral',
            statement: 'O Patrimônio Líquido representa a diferença positiva entre o valor do Ativo e o valor do Passivo Exigível.',
            question_type: 'certo_errado',
            options: { a: 'Certo', b: 'Errado' },
            correct_answer: 'a',
            explanation: 'Correto. A Equação Fundamental do Patrimônio estabelece que Ativo = Passivo + PL. Logo, PL = Ativo - Passivo Exigível.',
            source: 'ia_estilo_banca',
            banca_style: 'FGV'
          },
          {
            exam_id: selectedExam.id,
            discipline: 'Auditoria Fiscal',
            statement: 'Sobre os testes de auditoria, assinale a alternativa que indica o procedimento que visa obter evidência quanto à adequação do controle interno:',
            question_type: 'multipla_escolha',
            options: {
              a: 'Teste substantivo',
              b: 'Teste de observação ou cumprimento',
              c: 'Procedimento analítico',
              d: 'Inspeção física de ativos'
            },
            correct_answer: 'b',
            explanation: 'Testes de observação ou cumprimento (ou testes de controle) visam obter segurança razoável de que os controlos internos estão operando com eficácia.',
            source: 'ia_estilo_banca',
            banca_style: 'FGV'
          }
        ];

        const { data: insertedQ, error: insErr } = await supabase
          .from('questions')
          .insert(sampleQuestions)
          .select('*');

        if (!insErr && insertedQ) {
          qData = insertedQ;
        }
      }

      setQuestions(qData || []);

      // 2. Fetch user attempts
      const { data: attData, error: attErr } = await supabase
        .from('question_attempts')
        .select('*, questions (*)')
        .eq('user_id', user.id);

      if (attErr) throw attErr;
      setAttempts(attData || []);

    } catch (err) {
      console.error('Erro ao carregar questões:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer || answered || !user || questions.length === 0) return;
    setSubmitting(true);

    const currentQ = questions[currentIndex];
    const correct = selectedAnswer === currentQ.correct_answer;
    setIsCorrect(correct);
    setAnswered(true);

    try {
      await supabase.from('question_attempts').insert({
        user_id: user.id,
        question_id: currentQ.id,
        selected_answer: selectedAnswer,
        is_correct: correct
      });

      // Refresh attempts
      const { data: attData } = await supabase
        .from('question_attempts')
        .select('*, questions (*)')
        .eq('user_id', user.id);

      if (attData) setAttempts(attData);

    } catch (err) {
      console.error('Erro ao salvar tentativa:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setAnswered(false);
    setIsCorrect(null);
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  // Stats calculations
  const totalAnswered = attempts.length;
  const correctCount = attempts.filter(a => a.is_correct).length;
  const accuracyRate = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  const statsByDiscipline = attempts.reduce((acc: Record<string, { total: number; correct: number }>, att) => {
    const disc = att.questions?.discipline || 'Geral';
    if (!acc[disc]) acc[disc] = { total: 0, correct: 0 };
    acc[disc].total += 1;
    if (att.is_correct) acc[disc].correct += 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Banco de Questões</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Treine com questões inéditas e no estilo das principais bancas para <span className="font-medium text-indigo-600 dark:text-indigo-400">{selectedExam?.name}</span>.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('resolver')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'resolver'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Resolver Questões
          </button>
          <button
            onClick={() => setActiveTab('estatisticas')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'estatisticas'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Histórico & Estatísticas
          </button>
        </div>
      </div>

      {activeTab === 'resolver' ? (
        questions.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
            <HelpCircle className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700" />
            <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">Nenhuma questão disponível</h3>
            <p className="mt-1 text-sm text-gray-500">Não há questões cadastradas para este edital no momento.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm">
            {/* Question Header */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                  {currentQ.discipline}
                </span>
                {currentQ.banca_style && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {currentQ.banca_style}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Questão {currentIndex + 1} de {questions.length}
              </span>
            </div>

            {/* Statement */}
            <div className="text-base text-gray-900 dark:text-white font-medium leading-relaxed mb-6">
              {currentQ.statement}
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {currentQ.options && Object.entries(currentQ.options).map(([key, value]) => {
                const isSelected = selectedAnswer === key;
                let optionStyle = "border-gray-200 dark:border-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-gray-900";
                
                if (answered) {
                  if (key === currentQ.correct_answer) {
                    optionStyle = "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200";
                  } else if (isSelected && !isCorrect) {
                    optionStyle = "border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200";
                  }
                } else if (isSelected) {
                  optionStyle = "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200";
                }

                return (
                  <button
                    key={key}
                    disabled={answered}
                    onClick={() => setSelectedAnswer(key)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center space-x-3 ${optionStyle}`}
                  >
                    <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-xs uppercase text-gray-700 dark:text-gray-300 flex-shrink-0">
                      {key}
                    </span>
                    <span className="text-sm font-medium">{value}</span>
                  </button>
                );
              })}
            </div>

            {/* Submit / Next Actions */}
            {!answered ? (
              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  disabled={!selectedAnswer || submitting}
                  onClick={handleAnswerSubmit}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {submitting ? 'Respondendo...' : 'Responder Questão'}
                </button>
              </div>
            ) : (
              <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-gray-800 animate-in fade-in duration-300">
                <div className={`p-4 rounded-xl flex items-center space-x-3 ${
                  isCorrect 
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300' 
                    : 'bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300'
                }`}>
                  {isCorrect ? <CheckCircle2 className="h-6 w-6 flex-shrink-0" /> : <XCircle className="h-6 w-6 flex-shrink-0" />}
                  <div>
                    <h4 className="font-semibold text-sm">{isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta'}</h4>
                    <p className="text-xs mt-0.5">A alternativa correta é a letra <span className="uppercase font-bold">{currentQ.correct_answer}</span>.</p>
                  </div>
                </div>

                {currentQ.explanation && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Gabarito Comentado</h5>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{currentQ.explanation}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={nextQuestion}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center space-x-2 shadow-sm"
                  >
                    <span>Próxima Questão</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        /* Statistics Sub-tab */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Respondidas</span>
                <CheckSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{totalAnswered}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Taxa de Acerto</span>
                <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{accuracyRate}%</span>
                <span className="ml-2 text-sm text-gray-500">({correctCount} corretas)</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Questões Erradas</span>
                <RefreshCw className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{totalAnswered - correctCount}</span>
              </div>
            </div>
          </div>

          {/* Performance by Discipline */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Desempenho por Disciplina</h3>
            {Object.keys(statsByDiscipline).length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">Nenhuma questão respondida ainda.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(statsByDiscipline).map(([disc, stats]: [string, any]) => {
                  const rate = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                  return (
                    <div key={disc} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{disc}</span>
                        <span className="text-gray-500 dark:text-gray-400">{stats.correct}/{stats.total} ({rate}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${rate >= 70 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
