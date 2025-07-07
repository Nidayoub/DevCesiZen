'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import MainLayout from '../../components/MainLayout';

export default function DashboardPage() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Bonjour');
    } else if (hour < 18) {
      setGreeting('Bon après-midi');
    } else {
      setGreeting('Bonsoir');
    }
  }, []);

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              {greeting}, {user?.firstname} {user?.lastname}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Bienvenue sur votre tableau de bord CESIZen
            </p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Nom complet</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user?.firstname} {user?.lastname}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user?.email}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Rôle</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user?.role === 'user' && 'Utilisateur'}
                  {user?.role === 'admin' && 'Administrateur'}
                  {user?.role === 'super-admin' && 'Super Administrateur'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900">Diagnostics récents</h2>
            <p className="mt-1 text-sm text-gray-500">Vos dernières évaluations de stress</p>
            <div className="mt-4">
              <p className="text-center text-gray-400 italic">Aucun diagnostic récent</p>
            </div>
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900">Ressources populaires</h2>
            <p className="mt-1 text-sm text-gray-500">Contenus les plus consultés</p>
            <div className="mt-4">
              <ul className="space-y-2">
                <li className="text-indigo-600 hover:text-indigo-800">
                  <Link href="/info">Articles bien-être</Link>
                </li>
                <li className="text-indigo-600 hover:text-indigo-800">
                  <Link href="/info">Méditation guidée</Link>
                </li>
                <li className="text-indigo-600 hover:text-indigo-800">
                  <Link href="/info">Gestion du stress</Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900">Actions rapides</h2>
            <p className="mt-1 text-sm text-gray-500">Accès direct aux fonctionnalités</p>
            <div className="mt-4 space-y-2">
              <button className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
                Nouveau diagnostic
              </button>
              <button className="w-full bg-indigo-100 text-indigo-700 py-2 rounded hover:bg-indigo-200" 
                      onClick={() => window.location.href = '/info'}>
                Consulter articles bien-être
              </button>
            </div>
          </div>
        </div>

        {/* Section Ressources Recommandées */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Ressources recommandées</h3>
          <ul className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <li className="flow-root">
              <div className="p-4 bg-indigo-50 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 text-indigo-600">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <Link href="/info" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                      Méditation guidée
                    </Link>
                  </div>
                </div>
              </div>
            </li>
            <li className="flow-root">
              <div className="p-4 bg-indigo-50 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 text-indigo-600">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <Link href="/info" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                      Articles bien-être
                    </Link>
                  </div>
                </div>
              </div>
            </li>
            <li className="flow-root">
              <div className="p-4 bg-indigo-50 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 text-indigo-600">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <Link href="/diagnostic" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                      Historique des évaluations
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
} 