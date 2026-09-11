export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  aprovado: {
    Tables: {
      exams: {
        Row: {
          id: string;
          name: string;
          state: string;
          edition_year: number;
          status: 'ativo' | 'arquivado';
        };
        Insert: {
          id?: string;
          name: string;
          state: string;
          edition_year: number;
          status: 'ativo' | 'arquivado';
        };
        Update: Partial<Database['aprovado']['Tables']['exams']['Insert']>;
      };
      topics: {
        Row: {
          id: string;
          exam_id: string;
          discipline: string;
          subject: string;
          topic_name: string;
          recurrence: number;
          trend: 'crescente' | 'estável' | 'decrescente' | null;
          weight: number | null;
          priority: number | null;
          summary: string | null;
          exam_tips: string | null;
          source: string | null;
        };
        Insert: {
          id?: string;
          exam_id: string;
          discipline: string;
          subject: string;
          topic_name: string;
          recurrence?: number;
          trend?: 'crescente' | 'estável' | 'decrescente' | null;
          weight?: number | null;
          priority?: number | null;
          summary?: string | null;
          exam_tips?: string | null;
          source?: string | null;
        };
        Update: Partial<Database['aprovado']['Tables']['topics']['Insert']>;
      };
      weeks: {
        Row: {
          id: string;
          exam_id: string;
          week_number: number;
          title: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          exam_id: string;
          week_number: number;
          title: string;
          order_index: number;
        };
        Update: Partial<Database['aprovado']['Tables']['weeks']['Insert']>;
      };
      goals: {
        Row: {
          id: string;
          week_id: string;
          topic_id: string | null;
          type: 'teoria' | 'revisao';
          title: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          week_id: string;
          topic_id?: string | null;
          type: 'teoria' | 'revisao';
          title: string;
          order_index: number;
        };
        Update: Partial<Database['aprovado']['Tables']['goals']['Insert']>;
      };
      materials: {
        Row: {
          id: string;
          goal_id: string;
          type: 'videoaula' | 'pdf' | 'questoes' | 'tarefa';
          title: string;
          url: string | null;
          study_tip: string | null;
          ai_summary: string | null;
        };
        Insert: {
          id?: string;
          goal_id: string;
          type: 'videoaula' | 'pdf' | 'questoes' | 'tarefa';
          title: string;
          url?: string | null;
          study_tip?: string | null;
          ai_summary?: string | null;
        };
        Update: Partial<Database['aprovado']['Tables']['materials']['Insert']>;
      };
      questions: {
        Row: {
          id: string;
          topic_id: string | null;
          exam_id: string;
          discipline: string;
          statement: string;
          question_type: 'certo_errado' | 'multipla_escolha';
          options: Json | null;
          correct_answer: string;
          explanation: string | null;
          source: 'ia_nova' | 'ia_estilo_banca';
          banca_style: string | null;
          difficulty: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          topic_id?: string | null;
          exam_id: string;
          discipline: string;
          statement: string;
          question_type: 'certo_errado' | 'multipla_escolha';
          options?: Json | null;
          correct_answer: string;
          explanation?: string | null;
          source: 'ia_nova' | 'ia_estilo_banca';
          banca_style?: string | null;
          difficulty?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['aprovado']['Tables']['questions']['Insert']>;
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string;
          status: 'nao_estudado' | 'estudando' | 'estudado' | 'revisado';
          questions_done: number;
          correct_count: number;
          mastery_score: number;
          next_review_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic_id: string;
          status?: 'nao_estudado' | 'estudando' | 'estudado' | 'revisado';
          questions_done?: number;
          correct_count?: number;
          mastery_score?: number;
          next_review_at?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database['aprovado']['Tables']['user_progress']['Insert']>;
      };
      goal_completions: {
        Row: {
          id: string;
          user_id: string;
          material_id: string;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          material_id: string;
          completed_at?: string;
        };
        Update: Partial<Database['aprovado']['Tables']['goal_completions']['Insert']>;
      };
      question_attempts: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          selected_answer: string;
          is_correct: boolean;
          attempted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          selected_answer: string;
          is_correct: boolean;
          attempted_at?: string;
        };
        Update: Partial<Database['aprovado']['Tables']['question_attempts']['Insert']>;
      };
    };
  };
}
