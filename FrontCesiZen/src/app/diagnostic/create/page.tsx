'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '../../../components/MainLayout';
import { useAuth } from '../../../context/AuthContext';
import { diagnosticApi } from '../../../services/api.service';
import { StressEvent } from '../../../types';

export default function CreateDiagnosticPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stressEvents, setStressEvents] = useState<StressEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [transition, setTransition] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Vérification de l'authentification
  useEffect(() => {
    if (user !== undefined) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/diagnostic/create');
      }
    }
  }, [user, isAuthenticated, router]);

  // Chargement des événements de stress
  useEffect(() => {
    async function fetchStressEvents() {
      try {
        setLoading(true);
        const response = await diagnosticApi.getQuestions();
        
        const eventsData = response.data.events || response.data;
        
        if (Array.isArray(eventsData)) {
          setStressEvents(eventsData);
          
          // Extraire les catégories uniques
          const uniqueCategories = [...new Set(eventsData.map((event: StressEvent) => event.category))];
          setCategories(uniqueCategories);
          
          // Initialiser avec la première catégorie
          if (uniqueCategories.length > 0) {
            setCurrentCategory(uniqueCategories[0]);
          }
        } else {
          console.error('Format de données inattendu:', response.data);
          setError('Format de données inattendu. Veuillez réessayer.');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des événements de stress:', err);
        setError('Erreur lors du chargement du diagnostic. Veuillez réessayer.');
        setLoading(false);
      }
    }

    fetchStressEvents();
  }, []);

  // Calculer la progression
  useEffect(() => {
    if (categories.length > 0) {
      const currentCategoryIndex = categories.indexOf(currentCategory || categories[0]);
      setProgress((currentCategoryIndex + 1) / (categories.length + 1) * 100);
    }
  }, [currentCategory, categories]);

  // Gérer la sélection/désélection d'un événement
  const handleEventToggle = (eventId: number) => {
    setSelectedEvents(prev => {
      if (prev.includes(eventId)) {
        return prev.filter(id => id !== eventId);
      } else {
        return [...prev, eventId];
      }
    });
  };

  // Navigation entre catégories
  const goToNextCategory = () => {
    setTransition(true);
    setTimeout(() => {
      const currentIndex = categories.indexOf(currentCategory || '');
      if (currentIndex < categories.length - 1) {
        setCurrentCategory(categories[currentIndex + 1]);
      } else {
        handleSubmitDiagnostic();
      }
      setTransition(false);
    }, 500);
  };

  const goToPreviousCategory = () => {
    setTransition(true);
    setTimeout(() => {
      const currentIndex = categories.indexOf(currentCategory || '');
      if (currentIndex > 0) {
        setCurrentCategory(categories[currentIndex - 1]);
      }
      setTransition(false);
    }, 500);
  };

  // Soumission du diagnostic
  const handleSubmitDiagnostic = async () => {
    if (!selectedEvents || selectedEvents.length === 0) {
      setError("Veuillez sélectionner au moins un événement avant de soumettre le diagnostic.");
      return;
    }

    if (!isAuthenticated) {
      setError("Vous n'êtes pas authentifié. Veuillez vous connecter et réessayer.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const dataToSend = { selectedEventIds: selectedEvents };
      const response = await diagnosticApi.submitDiagnostic(dataToSend);
      
      // Rediriger vers la page de résultat avec l'ID du diagnostic
      if (response.data && response.data.resultId) {
        router.push(`/diagnostic/result/${response.data.resultId}`);
      } else {
        router.push('/diagnostic/history');
      }
    } catch (err: any) {
      console.error('Erreur lors de la soumission du diagnostic:', err);
      const backendError = err.response?.data?.error || 'Erreur lors de la soumission du diagnostic. Veuillez réessayer.';
      setError(backendError);
      setSubmitting(false);
    }
  };

  // Rendu de l'interface
  if (!isAuthenticated && user !== undefined) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-10 bg-white shadow rounded-lg p-6">
            <p className="mt-1 text-gray-500">Veuillez vous connecter pour créer un diagnostic.</p>
            <Link href="/login?redirect=/diagnostic/create" className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
              Se connecter
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Créer un nouveau diagnostic</h1>
          <p className="mt-2 text-lg text-gray-600">
            Sélectionnez les événements qui s'appliquent à votre situation actuelle.
          </p>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="ml-3 text-gray-700">Chargement des questions...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 text-indigo-600 hover:text-indigo-800"
            >
              Réessayer
            </button>
          </div>
        ) : (
          <div className={`transition-opacity duration-500 ${transition ? 'opacity-0' : 'opacity-100'}`}>
            {currentCategory && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {currentCategory}
                </h2>
                <div className="space-y-3">
                  {stressEvents
                    .filter(event => event.category === currentCategory)
                    .map(event => (
                      <div key={event.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-indigo-600 mt-1"
                            checked={selectedEvents.includes(event.id)}
                            onChange={() => handleEventToggle(event.id)}
                          />
                          <div>
                            <p className="font-medium text-gray-800">{event.title}</p>
                            {event.description && (
                              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            )}
                            <p className="text-sm text-indigo-600 mt-1">
                              Points: {event.points}
                            </p>
                          </div>
                        </label>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button
                onClick={goToPreviousCategory}
                disabled={categories.indexOf(currentCategory || '') <= 0}
                className={`px-4 py-2 border border-gray-300 rounded-md ${
                  categories.indexOf(currentCategory || '') <= 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Précédent
              </button>
              <button
                onClick={goToNextCategory}
                disabled={submitting}
                className={`px-4 py-2 rounded-md ${
                  submitting
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                } text-white`}
              >
                {categories.indexOf(currentCategory || '') < categories.length - 1
                  ? 'Suivant'
                  : submitting
                  ? 'Enregistrement...'
                  : 'Terminer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 