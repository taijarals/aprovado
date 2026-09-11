import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Visão geral do seu progresso e metas de estudo.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-8 sm:p-10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Bem-vindo ao Aprova Fisco!
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Você está logado como: <span className="font-medium text-gray-900 dark:text-gray-200">{user?.email}</span>
          </p>
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              O setup inicial, a autenticação e o design system estão funcionando perfeitamente. Nas próximas fases, adicionaremos o painel com seu progresso, plano de estudos adaptativo e estatísticas para os concursos da SEFAZ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
