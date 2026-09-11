import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useExam } from '../contexts/ExamContext';
import { supabase } from '../lib/supabase';
import { 
  BookOpen, 
  Search, 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

interface TopicExamRow {
  id: string; // topic_exams id
  topic_id: string;
  discipline: string;
  subject: string;
  topic_name: string;
  recurrence: number;
  trend: 'crescente' | 'estável' | 'decrescente' | null;
  weight: number;
  priority: number;
  examsCount?: number;
  otherExams?: string[];
  status?: 'nao_estudado' | 'estudando' | 'estudado' | 'revisado';
}

type SortField = 'discipline' | 'subject' | 'recurrence' | 'weight' | 'priority';

export default function EditalMestre() {
  const { user } = useAuth();
  const { selectedExam, exams } = useExam();

  const [data, setData] = useState<TopicExamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    if (selectedExam && user) {
      fetchEditalData();
    }
  }, [selectedExam, user]);

  const fetchEditalData = async () => {
    if (!selectedExam || !user) return;
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch topic_exams for selected exam with joined topics
      const { data: teData, error: teErr } = await supabase
        .from('topic_exams')
        .select(`
          id,
          topic_id,
          recurrence,
          trend,
          weight,
          priority,
          topics (
            id,
            discipline,
            subject,
            topic_name
          )
        `)
        .eq('exam_id', selectedExam.id);

      if (teErr) throw teErr;

      // 2. Fetch all topic_exams across all exams to determine if topics belong to other exams
      const { data: allTeData, error: allTeErr } = await supabase
        .from('topic_exams')
        .select('topic_id, exam_id');

      if (allTeErr) throw allTeErr;

      const examMap = new Map<string, string>();
      exams.forEach(e => examMap.set(e.id, e.name));

      const topicExamsMap = new Map<string, string[]>();
      (allTeData || []).forEach(item => {
        const list = topicExamsMap.get(item.topic_id) || [];
        list.push(item.exam_id);
        topicExamsMap.set(item.topic_id, list);
      });

      // 3. Fetch user progress for this exam
      const { data: progData, error: progErr } = await supabase
        .from('user_progress')
        .select('topic_id, status')
        .eq('user_id', user.id)
        .eq('exam_id', selectedExam.id);

      if (progErr) throw progErr;

      const progMap = new Map<string, 'nao_estudado' | 'estudando' | 'estudado' | 'revisado'>();
      (progData || []).forEach(p => {
        progMap.set(p.topic_id, p.status);
      });

      // Assemble final rows
      const rows: TopicExamRow[] = (teData || []).map((item: any) => {
        const topic = item.topics;
        const otherExamIds = (topicExamsMap.get(item.topic_id) || []).filter(id => id !== selectedExam.id);
        const otherExamNames = otherExamIds.map(id => examMap.get(id) || 'Outro').filter(name => !name.includes(selectedExam.name));

        return {
          id: item.id,
          topic_id: item.topic_id,
          discipline: topic?.discipline || 'Geral',
          subject: topic?.subject || topic?.topic_name || '',
          topic_name: topic?.topic_name || '',
          recurrence: item.recurrence || 0,
          trend: item.trend,
          weight: item.weight || 1,
          priority: item.priority || 0,
          examsCount: (topicExamsMap.get(item.topic_id) || []).length,
          otherExams: otherExamNames,
          status: progMap.get(item.topic_id) || 'nao_estudado'
        };
      });

      setData(rows);
    } catch (err: any) {
      console.error('Erro ao carregar edital:', err);
      setError(err.message || 'Erro ao carregar dados do edital.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // Default descending for priority/weight/recurrence
    }
  };

  const updateTopicStatus = async (topicId: string, newStatus: 'nao_estudado' | 'estudando' | 'estudado' | 'revisado') => {
    if (!user || !selectedExam) return;

    // Optimistic update
    setData(prev => prev.map(item => item.topic_id === topicId ? { ...item, status: newStatus } : item));

    try {
      // Check if record exists in user_progress
      const { data: existing } = await supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
        .eq('exam_id', selectedExam.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('user_progress')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            topic_id: topicId,
            exam_id: selectedExam.id,
            status: newStatus
          });
      }
    } catch (err) {
      console.error('Erro ao atualizar status do tópico:', err);
      fetchEditalData(); // Revert on failure
    }
  };

  const disciplines = useMemo(() => {
    const set = new Set<string>();
    data.forEach(d => set.add(d.discipline));
    return Array.from(set).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.subject.toLowerCase().includes(search.toLowerCase()) ||
                            item.discipline.toLowerCase().includes(search.toLowerCase());
      const matchesDisc = selectedDiscipline === 'all' || item.discipline === selectedDiscipline;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      return matchesSearch && matchesDisc && matchesStatus;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (typeof valA === 'string') {
        return sortAsc ? (valA as string).localeCompare(valB as string) : (valB as string).localeCompare(valA as string);
      }
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [data, search, selectedDiscipline, selectedStatus, sortField, sortAsc]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
        <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
        <button onClick={fetchEditalData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Edital Mestre</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Matriz completa de tópicos e prioridades para <span className="font-medium text-indigo-600 dark:text-indigo-400">{selectedExam?.name}</span>.
        </p>
      </div>

      {/* Filters and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar assunto ou disciplina..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <select
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todas as Disciplinas</option>
            {disciplines.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos os Status</option>
            <option value="nao_estudado">Não Estudado</option>
            <option value="estudando">Estudando</option>
            <option value="estudado">Estudado</option>
            <option value="revisado">Revisado</option>
          </select>
        </div>
      </div>

      {/* Table view */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <button onClick={() => handleSort('discipline')} className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white">
                    <span>Disciplina / Assunto</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <button onClick={() => handleSort('recurrence')} className="inline-flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white">
                    <span>Recorrência</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tendência
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <button onClick={() => handleSort('weight')} className="inline-flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white">
                    <span>Peso</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <button onClick={() => handleSort('priority')} className="inline-flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white">
                    <span>Prioridade</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    Nenhum tópico encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{item.discipline}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{item.subject}</span>
                        {item.otherExams && item.otherExams.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.otherExams.map(exName => (
                              <span key={exName} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                Também em {exName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{item.recurrence}</span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {item.trend === 'crescente' && (
                        <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
                          <TrendingUp className="h-3 w-3 mr-1" /> Crescente
                        </span>
                      )}
                      {item.trend === 'decrescente' && (
                        <span className="inline-flex items-center text-rose-600 dark:text-rose-400 text-xs font-medium bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-lg">
                          <TrendingDown className="h-3 w-3 mr-1" /> Queda
                        </span>
                      )}
                      {item.trend === 'estável' && (
                        <span className="inline-flex items-center text-gray-500 dark:text-gray-400 text-xs font-medium bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                          <Minus className="h-3 w-3 mr-1" /> Estável
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{item.weight}</span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                        item.priority >= 40 
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' 
                          : item.priority >= 20 
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' 
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <select
                        value={item.status}
                        onChange={(e) => updateTopicStatus(item.topic_id, e.target.value as any)}
                        className={`text-xs font-medium rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer ${
                          item.status === 'revisado' 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' 
                            : item.status === 'estudado' 
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                            : item.status === 'estudando' 
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' 
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        <option value="nao_estudado">Não Estudado</option>
                        <option value="estudando">Estudando</option>
                        <option value="estudado">Estudado</option>
                        <option value="revisado">Revisado</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
