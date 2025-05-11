'use client';

import { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { diagnosticApi } from '../../services/api.service';
import { StressEvent, DiagnosticResult } from '../../types';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

// Define a type for the dynamic recommendations we expect
interface DynamicRecommendation {
  id: string | number;
  type: 'article' | 'exercise' | 'info'; // 'info' can be a general link
  title: string;
  description?: string;
  path: string; // e.g., /info/resources/some-slug or /resources/some-id
}

export default function DiagnosticPage() {
  const [stressEvents, setStressEvents] = useState<StressEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [transition, setTransition] = useState(false);
  const [savedToAccount, setSavedToAccount] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  // State for dynamic recommendations
  const [dynamicRecommendations, setDynamicRecommendations] = useState<DynamicRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [errorRecommendations, setErrorRecommendations] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStressEvents() {
      try {
        setLoading(true);
        const response = await diagnosticApi.getQuestions();
        
        // Vérifier que la réponse contient bien un tableau d'événements
        const eventsData = response.data.events || response.data;
        
        // S'assurer que eventsData est bien un tableau
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

  useEffect(() => {
    // Calculer la progression du quiz
    if (categories.length > 0) {
      const currentCategoryIndex = categories.indexOf(currentCategory || categories[0]);
      setProgress((currentCategoryIndex + 1) / (categories.length + 1) * 100);
    }
  }, [currentCategory, categories]);

  // Fetch dynamic recommendations when diagnosticResult is available
  useEffect(() => {
    if (diagnosticResult && diagnosticResult.stress_level) {
      const fetchRecommendations = async () => {
        setLoadingRecommendations(true);
        setErrorRecommendations(null);
        setDynamicRecommendations([]); // Clear previous recommendations
        try {
          // TODO: UNCOMMENT AND USE ACTUAL API CALL WHEN BACKEND ENDPOINT IS READY
          /*
          const response = await recommendationsApi.getRecommendations({
            stressLevel: diagnosticResult.stress_level,
            // potentially add other parameters like selectedEventIds: selectedEvents if your API uses them
            limit: 3 // example limit
          });
          if (response && response.data && Array.isArray(response.data.recommendations)) {
            setDynamicRecommendations(response.data.recommendations);
          } else {
            setDynamicRecommendations([]);
          }
          */
          console.log('Skipping recommendations fetch: Backend endpoint not implemented yet.');
          // For now, dynamicRecommendations will remain empty, and fallback will be used.

        } catch (err: any) {
          console.error("Failed to load dynamic recommendations:", err);
          setErrorRecommendations(err.message || "Impossible de charger les recommandations personnalisées.");
          setDynamicRecommendations([]); // Ensure it's empty on error
        } finally {
          setLoadingRecommendations(false);
        }
      };
      fetchRecommendations();
    }
  }, [diagnosticResult]); // Removed selectedEvents from dependency array as it might cause too many refetches

  const handleEventToggle = (eventId: number) => {
    setSelectedEvents(prev => {
      if (prev.includes(eventId)) {
        return prev.filter(id => id !== eventId);
      } else {
        return [...prev, eventId];
      }
    });
  };

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

  const handleSubmitDiagnostic = async () => {
    // Vérification frontend avant d'envoyer la requête
    if (!selectedEvents || selectedEvents.length === 0) {
      setError("Veuillez sélectionner au moins un événement avant de soumettre le diagnostic.");
      // Optionnel: setLoading(false) si vous l'aviez mis à true avant cette vérification
      // Optionnel: setShowResults(false) pour ne pas tenter d'afficher une page de résultats vide
      return; // Arrêter l'exécution ici
    }

    if (!isAuthenticated) {
      setError("Vous n\'êtes pas authentifié. Veuillez vous connecter et réessayer.");
      setLoading(false); // Assurez-vous que l'état de chargement est réinitialisé
      return; // Arrêter l'exécution ici
    }

    try {
      setLoading(true); // Maintenant, nous pouvons mettre loading à true
      setShowResults(false);
      setDynamicRecommendations([]);
      setError(''); // Réinitialiser les erreurs précédentes
      setSavedToAccount(false);
      
      const dataToSend = { selectedEventIds: selectedEvents };
      console.log("Données envoyées pour la soumission du diagnostic:", dataToSend); // Gardons ce log pour le débogage

      const response = await diagnosticApi.submitDiagnostic(dataToSend);
      
      localStorage.setItem('diagnosticResult', JSON.stringify(response.data));
      setDiagnosticResult(response.data);
      setShowResults(true);
      
      if (isAuthenticated && response.data.resultId) {
        setSavedToAccount(true);
      }
    } catch (err: any) {
      console.error('Erreur lors de la soumission du diagnostic:', err);
      // Tenter de récupérer le message d'erreur du backend s'il existe
      const backendError = err.response?.data?.error || 'Erreur lors de la soumission du diagnostic. Veuillez réessayer.';
      setError(backendError);
    } finally {
      setLoading(false);
    }
  };

  const resetDiagnostic = () => {
    setSelectedEvents([]);
    setShowResults(false);
    setDiagnosticResult(null);
    setCurrentCategory(categories[0]);
    setSavedToAccount(false);
  };

  // Filtrer les événements par catégorie actuelle
  const currentEvents = stressEvents.filter(event => 
    !currentCategory || event.category === currentCategory
  );

  const getStressLevelIcon = (stressLevel: string) => {
    const level = stressLevel.toLowerCase();
    if (level.includes('faible')) return '🟢';
    if (level.includes('modéré')) return '🟠';
    if (level.includes('élevé')) return '🔴';
    return '⚪';
  };

  // Générer des recommandations personnalisées basées sur le niveau de stress
  const getPersonalizedRecommendations = () => {
    if (!diagnosticResult) return null;
    
    const stressLevel = (diagnosticResult.stress_level || diagnosticResult.stressLevel || '').toLowerCase();
    
    if (stressLevel.includes('faible')) {
      return (
        <div className="rounded-lg bg-green-50 p-6 border-l-4 border-green-500 mt-6">
          <h3 className="text-xl font-bold text-green-800 mb-3">
            🟢 Votre score de stress est faible.
          </h3>
          <p className="text-green-700 mb-4">
            Vous semblez gérer les événements de la vie avec équilibre.
            C'est un bon signe, mais cela ne veut pas dire qu'il faut négliger votre santé mentale.
          </p>

          <h4 className="font-semibold text-green-800 mb-2">✅ Quelques conseils pour maintenir votre bien-être :</h4>
          <ul className="list-disc pl-6 text-green-700 mb-4 space-y-2">
            <li>Continuez à avoir des routines régulières (sommeil, alimentation).</li>
            <li>Pratiquez une activité physique modérée.</li>
            <li>Prenez du temps pour vous (lecture, nature, détente).</li>
            <li>Parlez à vos proches, même quand tout va bien.</li>
          </ul>

          <h4 className="font-semibold text-green-800 mb-2">🔗 Ressources utiles :</h4>
          <ul className="space-y-2">
            <li>
              <a href="/info" className="text-green-600 hover:text-green-800 underline flex items-center">
                <span className="mr-2">→</span> Exercices de respiration guidée
              </a>
            </li>
            <li>
              <a href="/info" className="text-green-600 hover:text-green-800 underline flex items-center">
                <span className="mr-2">→</span> Astuces pour éviter le stress latent
              </a>
            </li>
            <li>
              <a href="/info" className="text-green-600 hover:text-green-800 underline flex items-center">
                <span className="mr-2">→</span> Prendre soin de sa santé mentale
              </a>
            </li>
          </ul>
        </div>
      );
    } else if (stressLevel.includes('modéré')) {
      return (
        <div className="rounded-lg bg-orange-50 p-6 border-l-4 border-orange-500 mt-6">
          <h3 className="text-xl font-bold text-orange-800 mb-3">
            🟠 Votre score indique un stress modéré.
          </h3>
          <p className="text-orange-700 mb-4">
            Certains événements récents ont pu affecter votre équilibre émotionnel.
            Il est important de ne pas les ignorer.
          </p>

          <h4 className="font-semibold text-orange-800 mb-2">🧘‍♂️ Recommandations :</h4>
          <ul className="list-disc pl-6 text-orange-700 mb-4 space-y-2">
            <li>Faites des pauses dans votre journée, même brèves.</li>
            <li>Essayez un exercice de cohérence cardiaque dès maintenant.</li>
            <li>Parlez à une personne de confiance de ce que vous ressentez.</li>
          </ul>

          <h4 className="font-semibold text-orange-800 mb-2">🔗 À consulter maintenant :</h4>
          <ul className="space-y-2">
            <li>
              <a href="/info" className="text-orange-600 hover:text-orange-800 underline flex items-center">
                <span className="mr-2">→</span> Mini guide pour apaiser l'esprit
              </a>
            </li>
            <li>
              <a href="/info" className="text-orange-600 hover:text-orange-800 underline flex items-center">
                <span className="mr-2">→</span> Exercice de respiration 7-4-8
              </a>
            </li>
            <li>
              <a href="/info" className="text-orange-600 hover:text-orange-800 underline flex items-center">
                <span className="mr-2">→</span> Trouvez un professionnel à contacter
              </a>
            </li>
          </ul>
        </div>
      );
    } else if (stressLevel.includes('élevé')) {
      return (
        <div className="rounded-lg bg-red-50 p-6 border-l-4 border-red-500 mt-6">
          <h3 className="text-xl font-bold text-red-800 mb-3">
            🔴 Votre score est élevé.
          </h3>
          <p className="text-red-700 mb-4">
            Il est probable que vous ressentiez une pression ou une charge émotionnelle importante.
            Vous n'êtes pas seul·e, et il est essentiel d'agir.
          </p>

          <h4 className="font-semibold text-red-800 mb-2">🧠 Ce que vous pouvez faire dès aujourd'hui :</h4>
          <ul className="list-disc pl-6 text-red-700 mb-4 space-y-2">
            <li>Essayez un exercice de respiration profonde.</li>
            <li>Notez vos émotions dans un journal (ou utilisez le tracker).</li>
            <li>Contactez un professionnel ou un service d'écoute.</li>
          </ul>

          <h4 className="font-semibold text-red-800 mb-2">🔗 Ressources immédiates :</h4>
          <ul className="space-y-2">
            <li>
              <a href="/info" className="text-red-600 hover:text-red-800 underline flex items-center">
                <span className="mr-2">→</span> Respiration guidée en 5 minutes
              </a>
            </li>
            <li>
              <a href="tel:3114" className="text-red-600 hover:text-red-800 underline flex items-center">
                <span className="mr-2">→</span> Numéro d'écoute anonyme : 3114 (Suicide Écoute)
              </a>
            </li>
            <li>
              <a href="/info" className="text-red-600 hover:text-red-800 underline flex items-center">
                <span className="mr-2">→</span> Annuaire des psychologues
              </a>
            </li>
          </ul>
        </div>
      );
    } else {
      return null;
    }
  };

  return (
    <MainLayout>
      <div className="py-10">
        <header>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Diagnostic de stress</h1>
            <p className="mt-2 text-lg text-gray-600">
              Évaluez votre niveau de stress selon l'échelle de Holmes et Rahe
            </p>
            {isAuthenticated && (
              <div className="mt-4">
                <Link href="/diagnostic/history" className="text-indigo-600 hover:text-indigo-800 border border-indigo-300 rounded-md px-4 py-2 text-sm font-medium">
                  Voir mon historique de diagnostics
                </Link>
              </div>
            )}
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          {loading && !showResults ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-16 h-16 border-t-4 border-indigo-500 border-solid rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Chargement du diagnostic...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : showResults && diagnosticResult ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white shadow-lg rounded-lg overflow-hidden"
            >
              <div className="p-6 bg-gradient-to-r from-indigo-700 to-indigo-500 text-white">
                <h2 className="text-2xl font-bold">Votre résultat</h2>
                <p className="text-indigo-100">Basé sur les événements de vie que vous avez sélectionnés</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <div className="text-5xl font-bold text-indigo-600 mb-2">
                      {diagnosticResult.total_score || diagnosticResult.score}
                    </div>
                    <div className="text-sm text-gray-500">Score total</div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <div className="mb-2">
                      <span className="text-2xl font-bold">
                        {getStressLevelIcon(diagnosticResult.stress_level || diagnosticResult.stressLevel || '')} {' '}
                        {diagnosticResult.stress_level || diagnosticResult.stressLevel}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">Niveau de stress</div>
                  </div>
                </div>
                
                {/* Message concernant la sauvegarde */}
                {isAuthenticated && (
                  <div className="mb-6 bg-indigo-50 p-4 rounded-md text-center">
                    <p className="text-indigo-700">
                      {savedToAccount 
                        ? "✅ Ce diagnostic a été enregistré dans votre compte." 
                        : "⚠️ Ce diagnostic n'a pas pu être enregistré dans votre compte."}
                    </p>
                    <p className="text-sm text-indigo-600 mt-1">
                      {savedToAccount 
                        ? "Vous pouvez le retrouver dans votre historique pour suivre votre évolution." 
                        : "Si vous souhaitez suivre votre évolution, veuillez vous reconnecter et refaire le diagnostic."}
                    </p>
                    {savedToAccount && (
                      <Link href="/diagnostic/history" className="mt-2 inline-block text-indigo-600 hover:text-indigo-800 underline text-sm">
                        Voir mon historique complet
                      </Link>
                    )}
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Échelle d'interprétation</h3>
                  <div className="bg-blue-50 p-4 rounded-md">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center"><span className="font-bold text-green-600 mr-2">🟢</span> <span>Score inférieur à 150 : Risque faible (moins de 30%)</span></li>
                      <li className="flex items-center"><span className="font-bold text-orange-500 mr-2">🟠</span> <span>Score entre 150 et 299 : Risque modéré (30% à 50%)</span></li>
                      <li className="flex items-center"><span className="font-bold text-red-600 mr-2">🔴</span> <span>Score de 300 ou plus : Risque élevé (plus de 80%)</span></li>
                    </ul>
                  </div>
                </div>
                
                {/* Message personnalisé basé sur le niveau de stress */}
                {getPersonalizedRecommendations()}
                
                <div className="bg-gray-50 rounded-lg p-6 mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Événements sélectionnés</h3>
                  <div className="space-y-2">
                    {(diagnosticResult.selected_events || diagnosticResult.selectedEvents || []).map((event) => (
                      <div key={event.id} className="flex justify-between items-center p-3 bg-white rounded shadow-sm">
                        <span className="text-sm text-gray-800">{event.event_text || event.title}</span>
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">{event.points} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-8 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={resetDiagnostic}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Refaire le diagnostic
                  </button>
                  
                  {isAuthenticated && (
                    <Link
                      href="/diagnostic/history"
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Voir mon historique
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Barre de progression */}
              <div className="mb-8">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-indigo-600 font-medium">Quiz en cours</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="bg-white shadow-lg rounded-lg overflow-hidden"
              >
                <div className="p-6 bg-indigo-50 border-b">
                  <h2 className="text-xl font-semibold text-indigo-900">
                    {currentCategory}
                  </h2>
                  <p className="text-indigo-700 text-sm mt-1">
                    Sélectionnez les événements que vous avez vécus durant les 12 derniers mois
                  </p>
                </div>
                
                <div className="p-6">
                  <div className={`space-y-4 transition-opacity duration-500 ${transition ? 'opacity-0' : 'opacity-100'}`}>
                    {currentEvents.map((event) => (
                      <motion.div 
                        key={event.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`
                          p-4 rounded-lg border-2 transition-all duration-300
                          ${selectedEvents.includes(event.id) 
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300 cursor-pointer'}
                        `}
                        onClick={() => handleEventToggle(event.id)}
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className={`
                              w-5 h-5 rounded-full flex items-center justify-center 
                              ${selectedEvents.includes(event.id) ? 'bg-indigo-500' : 'border border-gray-300'}
                            `}>
                              {selectedEvents.includes(event.id) && (
                                <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-900">
                                {event.event_text || event.title}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                {event.points} pts
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="mt-8 flex justify-between">
                    <button
                      onClick={goToPreviousCategory}
                      disabled={categories.indexOf(currentCategory || '') <= 0}
                      className={`
                        inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md
                        ${categories.indexOf(currentCategory || '') <= 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50'}
                      `}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Précédent
                    </button>
                    
                    <button
                      onClick={goToNextCategory}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      {categories.indexOf(currentCategory || '') < categories.length - 1 ? (
                        <>
                          Suivant
                          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </>
                      ) : (
                        'Voir les résultats'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </main>
      </div>
    </MainLayout>
  );
} 