import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useExam } from '../contexts/ExamContext';
import { supabase } from '../lib/supabase';
import { 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  Award, 
  TrendingUp, 
  BookOpen
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DisciplinePriority {
  discipline: string;
  avgPriority: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedExam } = useExam();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTopics: 0,
    completedTopics: 0,
    progressPercentage: 0,
    questionsAnswered: 0,
    accuracyRate: 0,
    pendingTopics: 0
  });
  const [priorityChartData, setPriorityChartData] = useState<DisciplinePriority[]>([]);

  useEffect(() => {
    if (selectedExam && user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [selectedExam, user]);

  const fetchDashboardData = async () => {
    if (!selectedExam || !user) return;
    try {
      setLoading(true);

      // 1. Fetch topic_exams for selected exam joined with topics
      const { data: teData, error: teErr } = await supabase
        .from('topic_exams')
        .select(`
          priority,
          topics (
            discipline
          )
        `)
        .eq('exam_id', selectedExam.id);

      if (teErr) throw teErr;

      const totalTopics = teData?.length || 0;

      // Group by discipline to calculate average priority
      const discMap = new Map<string, { sum: number; count: number }>();
      (teData || []).forEach((item: any) => {
        const disc = item.topics?.discipline || 'Geral';
        const current = discMap.get(disc) || { sum: 0, count: 0 };
        discMap.set(disc, {
          sum: current.sum + (item.priority || 0),
          count: current.count + 1
        });
      });

      const chartData: DisciplinePriority[] = Array.from(discMap.entries()).map(([discipline, val]) => ({
        discipline: discipline.length > 15 ? discipline.substring(0, 15) + '...' : discipline,
        avgPriority: Number((val.sum / val.count).toFixed(1))
      })).sort((a, b) => b.avgPriority - a.avgPriority);

      setPriorityChartData(chartData);

      // 2. Fetch user progress for this exam
      const { data: progData, error: progErr } = await supabase
        .from('user_progress')
        .select('status')
        .eq('user_id', user.id)
        .eq('exam_id', selectedExam.id);

      if (progErr) throw progErr;

      const completedCount = (progData || []).filter(p => p.status === 'estudado' || p.status === 'revisado').length;
      const progressPercentage = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;
      const pendingTopics = totalTopics - completedCount;

      // 3. Fetch question attempts
      const { data: attData, error: attErr } = await supabase
        .from('question_attempts')
        .select('is_correct')
        .eq('user_id', user.id);

      if (attErr) throw attErr;

      const questionsAnswered = attData?.length || 0;
      const correctCount = (attData || []).filter(a => a.is_correct).length;
      const accuracyRate = questionsAnswered > 0 ? Math.round((correctCount / questionsAnswered) * 100) : 0;

      setStats({
        totalTopics,
        completedTopics: completedCount,
        progressPercentage,
        questionsAnswered,
        accuracyRate,
        pendingTopics
      });

    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Acompanhamento de desempenho para <span className="font-medium text-indigo-600 dark:text-indigo-400">{selectedExam?.name}</span> ({selectedExam?.edition_year}).
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Progresso Geral</span>
            <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{stats.progressPercentage}%</span>
            <span className="ml-2 text-xs text-gray-500">({stats.completedTopics}/{stats.totalTopics} tópicos)</span>
          </div>
          <div className="mt-4 w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${stats.progressPercentage}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tópicos Pendentes</span>
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{stats.pendingTopics}</span>
            <span className="ml-2 text-xs text-gray-500">tópicos</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Questões Respondidas</span>
            <HelpCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{stats.questionsAnswered}</span>
            <span className="ml-2 text-xs text-gray-500">questões</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Taxa de Acerto</span>
            <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{stats.accuracyRate}%</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 sm:p-8 rounded-2xl shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Prioridade Média por Disciplina</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Média ponderada de relevância e recorrência dos tópicos por disciplina no edital.</p>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityChartData} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis 
                dataKey="discipline" 
                angle={-25} 
                textAnchor="end" 
                interval={0} 
                height={60} 
                tick={{ fill: '#9CA3AF', fontSize: 12 }} 
              />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '0.75rem', color: '#F3F4F6' }}
              />
              <Bar dataKey="avgPriority" fill="#4F46E5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
