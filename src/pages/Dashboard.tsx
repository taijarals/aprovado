import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <div className="mt-4">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Bem-vindo ao Aprova Fisco!
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Você está logado como: <span className="font-semibold">{user?.email}</span>
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <p className="text-gray-700">
              O setup inicial e a autenticação estão funcionando perfeitamente. Nas próximas fases, adicionaremos o painel com seu progresso, simulados e estatísticas de estudo para os concursos da SEFAZ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
