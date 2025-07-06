'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainLayout from '../../../components/MainLayout';
import { useAuth } from '../../../context/AuthContext';
import { diagnosticApi } from '../../../services/api.service';

interface DiagnosticHistoryEntry {
  id: number;
  total_score: number;
  stress_level: string;
  date: string;
  event_ids?: string;
}

export default function DiagnosticHistoryPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [history, setHistory] = useState<DiagnosticHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user !== undefined) {
      setAuthCheckComplete(true);
      if (!isAuthenticated) {
        router.push('/login?redirect=/diagnostic/history');
      }
    }
  }, [user, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && authCheckComplete) {
      const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await diagnosticApi.getUserHistory();
          setHistory(response.data.diagnostics || []);
        } catch (err: any) {
          console.error("Erreur lors de la récupération de l'historique:", err);
          if (err.response?.status === 401) {
            setError("Votre session a peut-être expiré. Veuillez vous reconnecter.");
            router.push('/login?redirect=/diagnostic/history');
          } else {
            setError(err.message || "Impossible de charger l'historique des diagnostics.");
          }
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    } else if (!isAuthenticated && authCheckComplete) {
      setLoading(false);
    }
  }, [isAuthenticated, authCheckComplete, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (!authCheckComplete) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Historique des Diagnostics</h1>
            <p className="mt-2 text-lg text-gray-600">
              Retrouvez ici vos précédents résultats de diagnostic de stress.
            </p>
          </div>
          <Link href="/diagnostic/create" className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            Nouveau diagnostic
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="ml-3 text-gray-700">Chargement de l'historique...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-center">
            <p className="text-red-700 font-semibold">Erreur</p>
            <p className="text-red-600">{error}</p>
            {error.includes("reconnecter") && 
              <Link href="/login?redirect=/diagnostic/history" className="mt-2 inline-block text-indigo-600 hover:underline">
                Se connecter
              </Link>
            }
          </div>
        )}

        {!loading && !error && history.length === 0 && isAuthenticated && (
          <div className="text-center py-10 bg-white shadow rounded-lg p-6">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-xl font-medium text-gray-900">Aucun diagnostic trouvé</h3>
            <p className="mt-1 text-gray-500">
              Vous n'avez pas encore de diagnostic enregistré dans votre historique.
            </p>
            <Link href="/diagnostic" className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
              Faire un nouveau diagnostic
            </Link>
          </div>
        )}

        {!loading && !error && !isAuthenticated && authCheckComplete && (
          <div className="text-center py-10 bg-white shadow rounded-lg p-6">
            <p className="mt-1 text-gray-500">Veuillez vous connecter pour voir votre historique.</p>
            <Link href="/login?redirect=/diagnostic/history" className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
              Se connecter
            </Link>
          </div>
        )}

        {!loading && !error && history.length > 0 && isAuthenticated && (
          <div className="space-y-6">
            {history.map((entry) => (
              <div key={entry.id} className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className={`p-5 border-l-8 ${entry.stress_level.toLowerCase().includes('faible') ? 'border-green-500' : entry.stress_level.toLowerCase().includes('modéré') ? 'border-orange-500' : 'border-red-500'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold text-gray-800">
                      Score : <span className="text-indigo-600">{entry.total_score}</span> - {entry.stress_level}
                    </h2>
                    <p className="text-sm text-gray-500">{formatDate(entry.date)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 