import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen, 
  CheckSquare, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Plano de Estudo (em breve)', href: '#', icon: Calendar },
    { name: 'Edital (em breve)', href: '#', icon: BookOpen },
    { name: 'Questões (em breve)', href: '#', icon: CheckSquare },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
          <div className="flex items-center h-16 flex-shrink-0 px-6">
            <div className="flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 w-8 h-8 rounded-lg mr-3">
              <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-gray-900 dark:text-white text-lg font-bold tracking-tight">Aprova Fisco</span>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-4 py-6 space-y-1.5">
              {navigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <a className={`${isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'} group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors`}>
                      <item.icon className={`${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'} mr-3 flex-shrink-0 h-5 w-5 transition-colors`} aria-hidden="true" />
                      {item.name}
                    </a>
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
      <div className="md:hidden flex flex-col w-full h-full absolute">
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
            <nav className="px-4 pt-4 pb-4 space-y-1.5">
              {navigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <a onClick={() => setMobileMenuOpen(false)} className={`${isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'} group flex items-center px-3 py-3 text-base font-medium rounded-lg`}>
                      <item.icon className={`${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'} mr-4 flex-shrink-0 h-5 w-5`} aria-hidden="true" />
                      {item.name}
                    </a>
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
            <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
