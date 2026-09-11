import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface Exam {
  id: string;
  name: string;
  state: string;
  edition_year: number;
  status: 'ativo' | 'arquivado';
}

interface ExamContextType {
  exams: Exam[];
  selectedExam: Exam | null;
  setSelectedExam: (exam: Exam) => void;
  loadingExams: boolean;
  refreshExams: () => Promise<void>;
  schemaError: string | null;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export function ExamProvider({ children }: { children: ReactNode }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [loadingExams, setLoadingExams] = useState(true);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const fetchExams = async () => {
    try {
      setLoadingExams(true);
      setSchemaError(null);
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('status', 'ativo')
        .order('name', { ascending: true });

      if (error) {
        if (error.code === 'PGRST106' || error.message?.includes('aprovado')) {
          setSchemaError('O schema "aprovado" não está exposto na API do Supabase. Acesse o painel do seu projeto em Project Settings > API > Exposed schemas e adicione "aprovado".');
        } else {
          throw error;
        }
      }

      if (data && data.length > 0) {
        setExams(data);
        const ba = data.find(e => e.name.includes('SEFAZ-BA')) || data[0];
        if (!selectedExam || !data.some(e => e.id === selectedExam.id)) {
          setSelectedExam(ba);
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar exames:', err);
      if (err?.code === 'PGRST106' || err?.message?.includes('aprovado')) {
        setSchemaError('O schema "aprovado" não está exposto na API do Supabase. Acesse o painel do seu projeto em Project Settings > API > Exposed schemas e adicione "aprovado".');
      }
    } finally {
      setLoadingExams(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  return (
    <ExamContext.Provider
      value={{
        exams,
        selectedExam,
        setSelectedExam,
        loadingExams,
        refreshExams: fetchExams,
        schemaError,
      }}
    >
      {children}
    </ExamContext.Provider>
  );
}

export function useExam() {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam deve ser usado dentro de um ExamProvider');
  }
  return context;
}
