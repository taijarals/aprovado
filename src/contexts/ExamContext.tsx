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
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export function ExamProvider({ children }: { children: ReactNode }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [loadingExams, setLoadingExams] = useState(true);

  const fetchExams = async () => {
    try {
      setLoadingExams(true);
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('status', 'ativo')
        .order('name', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setExams(data);
        // Default to SEFAZ-BA if available, otherwise first
        const ba = data.find(e => e.name.includes('SEFAZ-BA')) || data[0];
        if (!selectedExam || !data.some(e => e.id === selectedExam.id)) {
          setSelectedExam(ba);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar exames:', err);
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
