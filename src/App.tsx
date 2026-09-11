/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';
import { Route, Switch, Redirect } from 'wouter';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ExamProvider } from './contexts/ExamContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PlanoEstudo from './pages/PlanoEstudo';
import EditalMestre from './pages/EditalMestre';
import Questoes from './pages/Questoes';
import Layout from './components/Layout';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" replace />;
  }

  return (
    <ExamProvider>
      <Layout>{children}</Layout>
    </ExamProvider>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to="/" replace /> : <Login />}
      </Route>
      
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/plano">
        <ProtectedRoute>
          <PlanoEstudo />
        </ProtectedRoute>
      </Route>

      <Route path="/edital">
        <ProtectedRoute>
          <EditalMestre />
        </ProtectedRoute>
      </Route>

      <Route path="/questoes">
        <ProtectedRoute>
          <Questoes />
        </ProtectedRoute>
      </Route>

      <Route>
        <ProtectedRoute>
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Página não encontrada</h2>
            <p className="mt-2 text-gray-500">A página solicitada não existe.</p>
          </div>
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
