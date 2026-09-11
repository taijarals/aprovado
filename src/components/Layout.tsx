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
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-gray-900">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
            <BookOpen className="h-8 w-8 text-blue-500" />
            <span className="ml-3 text-white text-lg font-semibold">Aprova Fisco</span>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <a className={`${isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}>
                      <item.icon className={`${isActive ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'} mr-3 flex-shrink-0 h-6 w-6`} aria-hidden="true" />
                      {item.name}
                    </a>
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex bg-gray-800 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="inline-block h-9 w-9 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white truncate max-w-[150px]">
                    {user?.email}
                  </p>
                  <button onClick={signOut} className="text-xs font-medium text-gray-300 hover:text-white flex items-center mt-1">
                    <LogOut className="h-4 w-4 mr-1" />
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
        <div className="flex items-center justify-between bg-gray-900 h-16 px-4">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-500" />
            <span className="ml-3 text-white text-lg font-semibold">Aprova Fisco</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-400 hover:text-white focus:outline-none">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="flex-1 bg-gray-900 z-10 w-full absolute top-16 left-0 shadow-lg pb-4">
            <nav className="px-2 pt-2 pb-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <a onClick={() => setMobileMenuOpen(false)} className={`${isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} group flex items-center px-2 py-2 text-base font-medium rounded-md`}>
                      <item.icon className="mr-4 flex-shrink-0 h-6 w-6" aria-hidden="true" />
                      {item.name}
                    </a>
                  </Link>
                )
              })}
              <div className="pt-4 mt-4 border-t border-gray-800">
                <div className="flex items-center px-2">
                  <div className="inline-block h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-white">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="mt-3 flex w-full items-center px-2 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md">
                  <LogOut className="mr-4 h-6 w-6" />
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
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
