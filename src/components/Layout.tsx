import { ReactNode, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useExam } from '../contexts/ExamContext';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen, 
  CheckSquare, 
  LogOut,
  Menu,
  X,
  ChevronDown,
  Award
} from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { exams, selectedExam, setSelectedExam } = useExam();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Plano de Estudo', href: '/plano', icon: Calendar },
    { name: 'Edital Mestre', href: '/edital', icon: BookOpen },
    { name: 'Questões', href: '/questoes', icon: CheckSquare },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
          <div className="flex items-center h-16 flex-shrink-0 px-6 justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 w-8 h-8 rounded-lg mr-3">
                <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-gray-900 dark:text-white text-lg font-bold tracking-tight">Aprova Fisco</span>
            </div>
          </div>

          {/* Exam Selector in Sidebar */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1 block">Concurso Ativo</label>
            <div className="relative">
              <select
                value={selectedExam?.id || ''}
                onChange={(e) => {
                  const found = exams.find(ex => ex.id === e.target.value);
                  if (found) setSelectedExam(found);
                }}
                className="w-full appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-8"
              >
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name} ({ex.edition_year})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-4 py-4 space-y-1.5">
              {navigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={`${isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'} group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors`}
                  >
                    <item.icon className={`${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'} mr-3 flex-shrink-0 h-5 w-5 transition-colors`} aria-hidden="true" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-100 dark:border-gray-800 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="inline-block h-9 w-9 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[140px]">
                    {user?.email}
                  </p>
                  <button onClick={signOut} className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center mt-0.5 transition-colors">
                    <LogOut className="h-3.5 w-3.5 mr-1" />
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden flex flex-col w-full h-full absolute z-20">
        <div className="flex items-center justify-between bg-white dark:bg-gray-900 h-16 px-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <div className="flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 w-8 h-8 rounded-lg mr-3">
              <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-gray-900 dark:text-white text-lg font-bold tracking-tight">Aprova Fisco</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="flex-1 bg-white dark:bg-gray-900 z-10 w-full absolute top-16 left-0 shadow-lg pb-4 border-b border-gray-200 dark:border-gray-800">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1 block">Concurso Ativo</label>
              <select
                value={selectedExam?.id || ''}
                onChange={(e) => {
                  const found = exams.find(ex => ex.id === e.target.value);
                  if (found) setSelectedExam(found);
                }}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none"
              >
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name} ({ex.edition_year})</option>
                ))}
              </select>
            </div>
            <nav className="px-4 pt-2 pb-4 space-y-1.5">
              {navigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`${isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'} group flex items-center px-3 py-3 text-base font-medium rounded-lg`}
                  >
                    <item.icon className={`${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'} mr-4 flex-shrink-0 h-5 w-5`} aria-hidden="true" />
                    {item.name}
                  </Link>
                )
              })}
              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center px-3">
                  <div className="inline-block h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="mt-4 flex w-full items-center px-3 py-3 text-base font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg">
                  <LogOut className="mr-4 h-5 w-5" />
                  Sair
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-col w-full md:pl-64">
        <main className="flex-1 pt-16 md:pt-0">
          <div className="py-8 md:py-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
