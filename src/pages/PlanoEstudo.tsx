import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useExam } from '../contexts/ExamContext';
import { supabase } from '../lib/supabase';
import { 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Circle, 
  FileText, 
  Video, 
  HelpCircle, 
  ListFilter, 
  Info,
  X,
  BookOpen
} from 'lucide-react';

interface Material {
  id: string;
  goal_id: string;
  type: 'videoaula' | 'pdf' | 'questoes' | 'tarefa';
  title: string;
  url: string | null;
  study_tip: string | null;
  ai_summary: string | null;
}

interface Goal {
  id: string;
  week_id: string;
  topic_id: string | null;
  type: 'teoria' | 'revisao';
  title: string;
  order_index: number;
  materials?: Material[];
}

interface Week {
  id: string;
  exam_id: string;
  week_number: number;
  title: string;
  order_index: number;
  goals?: Goal[];
}

export default function PlanoEstudo() {
  const { user } = useAuth();
  const { selectedExam } = useExam();

  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded weeks state (default expand current or week 1)
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});
  
  // Completions map: material_id -> boolean
  const [completions, setCompletions] = useState<Record<string, boolean>>({});

  // Discipline filter for flat view
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [allDisciplines, setAllDisciplines] = useState<string[]>([]);

  // Study Tip modal state
  const [activeTip, setActiveTip] = useState<{ title: string; tip: string } | null>(null);

  useEffect(() => {
    if (selectedExam && user) {
      fetchStudyPlan();
    }
  }, [selectedExam, user]);

  const fetchStudyPlan = async () => {
    if (!selectedExam || !user) return;
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch weeks
      const { data: weeksData, error: weeksErr } = await supabase
        .from('weeks')
        .select('*')
        .eq('exam_id', selectedExam.id)
        .order('week_number', { ascending: true });

      if (weeksErr) throw weeksErr;

      const weekIds = (weeksData || []).map(w => w.id);
      if (weekIds.length === 0) {
        setWeeks([]);
        setLoading(false);
        return;
      }

      // 2. Fetch goals
      const { data: goalsData, error: goalsErr } = await supabase
        .from('goals')
        .select('*')
        .in('week_id', weekIds)
        .order('order_index', { ascending: true });

      if (goalsErr) throw goalsErr;

      const goalIds = (goalsData || []).map(g => g.id);

      // 3. Fetch materials
      const { data: materialsData, error: matsErr } = await supabase
        .from('materials')
        .select('*')
        .in('goal_id', goalIds);

      if (matsErr) throw matsErr;

      // 4. Fetch user completions
      const { data: compData, error: compErr } = await supabase
        .from('goal_completions')
        .select('material_id')
        .eq('user_id', user.id);

      if (compErr) throw compErr;

      const compMap: Record<string, boolean> = {};
      (compData || []).forEach(c => {
        compMap[c.material_id] = true;
      });
      setCompletions(compMap);

      // Extract unique disciplines for filtering
      const discs = new Set<string>();
      (goalsData || []).forEach(g => {
        const parts = g.title.split('-');
        if (parts.length > 0) {
          discs.add(parts[0].trim());
        }
      });
      setAllDisciplines(Array.from(discs).sort());

      // Assemble hierarchy
      const materialsByGoal = (materialsData || []).reduce((acc: Record<string, Material[]>, m) => {
        if (!acc[m.goal_id]) acc[m.goal_id] = [];
        acc[m.goal_id].push(m);
        return acc;
      }, {});

      const goalsByWeek = (goalsData || []).reduce((acc: Record<string, Goal[]>, g) => {
        if (!acc[g.week_id]) acc[g.week_id] = [];
        acc[g.week_id].push({
          ...g,
          materials: materialsByGoal[g.id] || []
        });
        return acc;
      }, {});

      const fullWeeks = (weeksData || []).map(w => ({
        ...w,
        goals: goalsByWeek[w.id] || []
      }));

      setWeeks(fullWeeks);

      // Default expand week 1 or current week
      if (fullWeeks.length > 0) {
        setExpandedWeeks({ [fullWeeks[0].id]: true });
      }

    } catch (err: any) {
      console.error('Erro ao carregar plano de estudo:', err);
      setError(err.message || 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMaterialCompletion = async (materialId: string) => {
    if (!user) return;
    const isCompleted = !!completions[materialId];

    // Optimistic update
    setCompletions(prev => ({ ...prev, [materialId]: !isCompleted }));

    try {
      if (isCompleted) {
        await supabase
          .from('goal_completions')
          .delete()
          .eq('user_id', user.id)
          .eq('material_id', materialId);
      } else {
        await supabase
          .from('goal_completions')
          .insert({
            user_id: user.id,
            material_id: materialId
          });
      }
    } catch (err) {
      console.error('Erro ao atualizar conclusão:', err);
      // Revert on error
      setCompletions(prev => ({ ...prev, [materialId]: isCompleted }));
    }
  };

  const toggleWeek = (weekId: string) => {
    setExpandedWeeks(prev => ({ ...prev, [weekId]: !prev[weekId] }));
  };

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
        <button onClick={fetchStudyPlan} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
          Tentar novamente
        </button>
      </div>
    );
  }

  // Filter goals if discipline filter is active
  const filteredWeeks = weeks.map(week => ({
    ...week,
    goals: (week.goals || []).filter(goal => {
      if (selectedDiscipline === 'all') return true;
      return goal.title.toLowerCase().startsWith(selectedDiscipline.toLowerCase());
    })
  })).filter(week => selectedDiscipline === 'all' || (week.goals && week.goals.length > 0));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Plano de Estudo</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Cronograma estruturado para <span className="font-medium text-indigo-600 dark:text-indigo-400">{selectedExam?.name}</span> ({selectedExam?.edition_year}).
          </p>
        </div>

        {/* Discipline Filter */}
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 shadow-sm">
          <ListFilter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
            className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
          >
            <option value="all">Todas as Disciplinas (Por Semana)</option>
            {allDisciplines.map(disc => (
              <option key={disc} value={disc}>{disc}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredWeeks.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700" />
          <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">Nenhum conteúdo encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">Não há metas correspondentes ao filtro selecionado para este concurso.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWeeks.map((week) => {
            const isExpanded = expandedWeeks[week.id] || selectedDiscipline !== 'all';
            const totalMaterials = week.goals?.reduce((acc, g) => acc + (g.materials?.length || 0), 0) || 0;
            const completedMaterials = week.goals?.reduce((acc, g) => {
              return acc + (g.materials?.filter(m => completions[m.id])?.length || 0);
            }, 0) || 0;
            const weekProgress = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;

            return (
              <div 
                key={week.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm transition-all"
              >
                {/* Week Header */}
                <button
                  onClick={() => toggleWeek(week.id)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                      W{week.week_number}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">{week.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {week.goals?.length || 0} metas • {completedMaterials}/{totalMaterials} materiais concluídos
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="hidden sm:flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${weekProgress}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 w-9 text-right">{weekProgress}%</span>
                    </div>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                </button>

                {/* Week Content (Goals & Materials) */}
                {isExpanded && (
                  <div className="px-6 py-4 divide-y divide-gray-100 dark:divide-gray-800">
                    {week.goals?.map((goal) => (
                      <div key={goal.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              goal.type === 'teoria' 
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            }`}>
                              {goal.type === 'teoria' ? 'Teoria' : 'Revisão'}
                            </span>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{goal.title}</h4>
                          </div>
                        </div>

                        {/* Materials List */}
                        <div className="mt-3 space-y-2 pl-2">
                          {goal.materials?.map((mat) => {
                            const isDone = !!completions[mat.id];
                            return (
                              <div 
                                key={mat.id}
                                className="flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/60 rounded-xl px-4 py-2.5 transition-colors hover:bg-gray-100/80 dark:hover:bg-gray-800"
                              >
                                <div className="flex items-center space-x-3 flex-1 min-w-0 pr-4">
                                  <button
                                    onClick={() => toggleMaterialCompletion(mat.id)}
                                    className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex-shrink-0"
                                    title={isDone ? "Marcar como pendente" : "Marcar como concluído"}
                                  >
                                    {isDone ? (
                                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 fill-emerald-50 dark:fill-emerald-950" />
                                    ) : (
                                      <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                                    )}
                                  </button>

                                  <div className="flex items-center space-x-2 min-w-0">
                                    {mat.type === 'videoaula' && <Video className="h-4 w-4 text-rose-500 flex-shrink-0" />}
                                    {mat.type === 'pdf' && <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                                    {mat.type === 'questoes' && <HelpCircle className="h-4 w-4 text-purple-500 flex-shrink-0" />}
                                    {mat.type === 'tarefa' && <BookOpen className="h-4 w-4 text-amber-500 flex-shrink-0" />}
                                    
                                    <span className={`text-sm truncate ${isDone ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200 font-medium'}`}>
                                      {mat.title}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  {mat.url && (
                                    <a
                                      href={mat.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg"
                                    >
                                      Acessar Material
                                    </a>
                                  )}
                                  {mat.study_tip && (
                                    <button
                                      onClick={() => setActiveTip({ title: mat.title, tip: mat.study_tip! })}
                                      className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                      title="Ver Dica de Estudo"
                                    >
                                      <Info className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Study Tip Modal */}
      {activeTip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setActiveTip(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 mb-2">
              <Info className="h-5 w-5" />
              <h3 className="text-base font-semibold">Dica de Estudo Estratégica</h3>
            </div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              {activeTip.title}
            </h4>
            <div className="max-h-96 overflow-y-auto pr-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
              {activeTip.tip}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                onClick={() => setActiveTip(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
