'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainLayout from '../../../components/MainLayout';
import { useAuth } from '../../../context/AuthContext';
import { diagnosticApi } from '../../../services/api.service';
import toast from 'react-hot-toast';

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
        } catch (err: unknown) {
          console.error("Erreur lors de la récupération de l'historique:", err);
          const error = err as { response?: { status?: number }; message?: string };
          if (error.response?.status === 401) {
            setError("Votre session a peut-être expiré. Veuillez vous reconnecter.");
            router.push('/login?redirect=/diagnostic/history');
          } else {
            setError(error.message || "Impossible de charger l&#39;historique des diagnostics.");
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

  const handleDeleteDiagnostic = async (id: number, stressLevel: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ce diagnostic ?\n\nNiveau de stress: ${stressLevel}`)) {
      return;
    }

    try {
      await diagnosticApi.deleteDiagnostic(id);
      // Mettre à jour la liste en supprimant l'élément
      setHistory(prev => prev.filter(diagnostic => diagnostic.id !== id));
      toast.success('Diagnostic supprimé avec succès');
    } catch (err: unknown) {
      console.error('Erreur lors de la suppression:', err);
      const error = err as { response?: { status?: number }; message?: string };
      if (error.response?.status === 401) {
        toast.error('Votre session a peut-être expiré. Veuillez vous reconnecter.');
        router.push('/login?redirect=/diagnostic/history');
      } else {
        toast.error('Impossible de supprimer le diagnostic');
      }
    }
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
          <Link href="/diagnostic" className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
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
              Vous n&#39;avez pas encore de diagnostic enregistré dans votre historique.
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
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-800">
                        Score : <span className="text-indigo-600">{entry.total_score}</span> - {entry.stress_level}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(entry.date)}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteDiagnostic(entry.id, entry.stress_level)}
                      className="ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200"
                      title="Supprimer ce diagnostic"
                    >
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
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