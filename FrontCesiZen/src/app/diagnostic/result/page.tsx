'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '../../../components/MainLayout';
// import { diagnosticApi } from '../../../services/api.service';
import { DiagnosticResult, StressEvent } from '../../../types';

// Composant qui utilise useSearchParams, enveloppé dans Suspense
function DiagnosticResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Récupérer l'ID du diagnostic depuis les paramètres d'URL
  const resultId = searchParams.get('id');

  useEffect(() => {
    // Si aucun ID n'est fourni, rediriger vers la page de diagnostic
    if (!resultId) {
      router.push('/diagnostic');
      return;
    }

    // Fonction pour récupérer les résultats du diagnostic
    const fetchDiagnosticResult = () => {
      try {
        // Récupérer les résultats depuis le localStorage
        const storedResults = localStorage.getItem('diagnosticResult');
        if (!storedResults) {
          throw new Error('Aucun résultat disponible');
        }

        // Tenter de parser les résultats
        const parsedResults = JSON.parse(storedResults);
        console.log('Résultats récupérés:', parsedResults);

        // Vérifier que les données sont valides
        if (!parsedResults || (typeof parsedResults !== 'object')) {
          throw new Error('Format de résultats invalide');
        }

        // Vérifier si le score et le niveau de stress sont présents
        if (!(parsedResults.total_score || parsedResults.score) || 
            !(parsedResults.stress_level || parsedResults.stressLevel)) {
          console.warn('Résultats incomplets:', parsedResults);
        }

        // Générer des recommandations par défaut si nécessaire
        if (!parsedResults.recommendations || !Array.isArray(parsedResults.recommendations) || parsedResults.recommendations.length === 0) {
          const stressLevelText = parsedResults.stress_level || parsedResults.stressLevel || '';
          const stressLevel = stressLevelText.toLowerCase();
          
          // Recommandations par défaut basées sur le niveau de stress
          if (stressLevel.includes('faible')) {
            parsedResults.recommendations = [
              "Maintenir un mode de vie équilibré",
              "Continuer à pratiquer des activités relaxantes",
              "Préserver la qualité de votre sommeil"
            ];
          } else if (stressLevel.includes('modéré')) {
            parsedResults.recommendations = [
              "Identifier et réduire les sources de stress",
              "Pratiquer des techniques de relaxation",
              "Envisager des techniques comme la méditation"
            ];
          } else if (stressLevel.includes('élevé')) {
            parsedResults.recommendations = [
              "Consulter un professionnel de santé",
              "Prendre des mesures immédiates pour réduire les facteurs de stress",
              "Accorder une priorité absolue à votre bien-être"
            ];
          } else {
            parsedResults.recommendations = [
              "Surveiller votre niveau de stress",
              "Pratiquer des techniques de relaxation",
              "Consulter un professionnel si vos symptômes persistent"
            ];
          }
        }

        setResult(parsedResults);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération des résultats:', err);
        setError('Impossible de récupérer les résultats du diagnostic.');
        setLoading(false);
      }
    };

    fetchDiagnosticResult();
  }, [resultId, router]);

  // Fonction pour obtenir la couleur du niveau de stress
  const getStressLevelColor = (stressLevel: string | undefined) => {
    if (!stressLevel) {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
    
    const level = stressLevel.toLowerCase();
    
    switch (true) {
      case level.includes('faible'):
      case level.includes('faible risque'):
        return 'bg-green-100 text-green-800 border-green-200';
      case level.includes('modéré'):
      case level.includes('risque modéré'):
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case level.includes('élevé'):
      case level.includes('risque élevé'):
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Récupérer des conseils personnalisés en fonction du niveau de stress
  const getPersonalizedAdvice = () => {
    if (!result) return [];

    // Vérifier si stress_level ou stressLevel existe
    const stressLevelText = result.stress_level || result.stressLevel || '';
    const stressLevel = stressLevelText.toLowerCase();
    
    if (stressLevel.includes('faible')) {
      return [
        "Continuez à maintenir vos habitudes de vie saines",
        "Pratiquez régulièrement des activités de détente (méditation, yoga, marche en nature)",
        "Maintenir de bonnes habitudes de sommeil est essentiel même avec un niveau de stress faible",
        "Pensez à prendre des pauses régulières dans votre journée pour vous ressourcer"
      ];
    } else if (stressLevel.includes('modéré')) {
      return [
        "Essayez d&#39;identifier les sources de votre stress et agissez sur celles que vous pouvez contrôler",
        "Intégrez des exercices de relaxation quotidiens (3-5 minutes, 2-3 fois par jour)",
        "Améliorez votre hygiène de sommeil (horaires réguliers, routine de coucher, pas d'écrans)",
        "Considérez de parler à un proche ou un professionnel de vos sources de stress",
        "L&#39;exercice physique régulier peut significativement réduire votre niveau de stress"
      ];
    } else if (stressLevel.includes('élevé')) {
      return [
        "Nous vous recommandons fortement de consulter un professionnel de santé",
        "Accordez une priorité absolue à votre bien-être et votre santé mentale",
        "Pratiquez des techniques de relaxation plusieurs fois par jour",
        "Réduisez autant que possible les sources de stress dans votre environnement",
        "Parlez de votre situation à des proches de confiance et demandez leur soutien",
        "Accordez-vous des moments de calme et de repos quotidiens",
        "Considérez des techniques comme la méditation guidée ou le yoga"
      ];
    } else {
      // Si le niveau de stress n'est pas identifiable, retourner des conseils généraux
      return [
        "Prenez soin de votre santé mentale et physique au quotidien",
        "Pratiquez régulièrement des techniques de relaxation",
        "Maintenez un bon équilibre entre vie professionnelle et personnelle",
        "N'hésitez pas à consulter un professionnel de santé si nécessaire"
      ];
    }
  };

  // Grouper les événements par catégorie
  const groupEventsByCategory = () => {
    // Récupérer les événements à partir de selected_events ou selectedEvents
    const events = result?.selected_events || result?.selectedEvents || [];
    
    // S'assurer que events est bien un tableau
    if (!result || !Array.isArray(events) || events.length === 0) {
      return {};
    }
    
    return events.reduce((groups: {[key: string]: StressEvent[]}, event) => {
      const category = event.category || 'Autre';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(event);
      return groups;
    }, {});
  };

  const eventsByCategory = groupEventsByCategory();
  const personalizedAdvice = getPersonalizedAdvice();

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <div className="mt-4">
                  <Link
                    href="/diagnostic"
                    className="text-sm font-medium text-red-700 hover:text-red-600"
                  >
                    Retour au diagnostic
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!result) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p>Aucun résultat disponible. Veuillez effectuer un diagnostic.</p>
            <div className="mt-4">
              <Link
                href="/diagnostic"
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Faire un diagnostic
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">Résultats de votre diagnostic de stress</h1>
            <p className="mt-2 text-lg text-gray-600">
              Basé sur l&#39;échelle scientifique de Holmes et Rahe
            </p>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              {/* Vue d'ensemble du résultat */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-indigo-700 to-indigo-500">
                  <h2 className="text-xl font-bold text-white">Vue d'ensemble</h2>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="col-span-1">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-indigo-600 mb-2">
                          {result?.total_score || result?.score || 0}
                        </div>
                        <div className="text-sm text-gray-500">Score total</div>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <div className="text-center">
                        <div className="mb-2">
                          <span className={`text-xl font-bold px-4 py-2 rounded-full ${getStressLevelColor(result?.stress_level || result?.stressLevel)}`}>
                            {result?.stress_level || result?.stressLevel || 'Non disponible'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">Niveau de stress</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explication du score */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                <div className="px-4 py-5 sm:px-6">
                  <h2 className="text-xl font-medium text-gray-900">Que signifie votre score ?</h2>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                  <p className="text-base text-gray-700">
                    L&#39;échelle de Holmes et Rahe est un outil scientifique qui mesure l&#39;impact des événements de vie sur votre niveau de stress. Chaque événement a un poids spécifique en points qui reflète son impact potentiel sur votre santé.
                  </p>
                  <div className="mt-4 p-4 rounded-md bg-blue-50">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Interprétation :</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Score inférieur à 150</strong> : Risque faible de développer des problèmes de santé liés au stress (moins de 30%).</li>
                            <li><strong>Score entre 150 et 299</strong> : Risque modéré de développer des problèmes de santé liés au stress (30% à 50%).</li>
                            <li><strong>Score de 300 ou plus</strong> : Risque élevé de développer des problèmes de santé liés au stress (plus de 80%).</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommandations personnalisées */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                <div className="px-4 py-5 sm:px-6">
                  <h2 className="text-xl font-medium text-gray-900">Recommandations personnalisées</h2>
                </div>
                <div className="border-t border-gray-200">
                  <ul className="divide-y divide-gray-200">
                    {personalizedAdvice.map((advice, index) => (
                      <li key={index} className="px-4 py-4 sm:px-6">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-base text-gray-700">{advice}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Événements sélectionnés par catégorie */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                <div className="px-4 py-5 sm:px-6">
                  <h2 className="text-xl font-medium text-gray-900">Événements de vie sélectionnés</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Répartition par catégorie
                  </p>
                </div>
                <div className="border-t border-gray-200">
                  {Object.entries(eventsByCategory).map(([category, events]) => (
                    <div key={category} className="px-4 py-5 sm:px-6 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">{category}</h3>
                      <div className="mt-4">
                        <ul className="divide-y divide-gray-200">
                          {events.map((event) => (
                            <li key={event.id} className="py-3 flex justify-between">
                              <div className="text-sm font-medium text-gray-900">{event.event_text || event.title}</div>
                              <div className="text-sm font-medium text-indigo-600">{event.points} points</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Next steps */}
              <div className="bg-indigo-50 rounded-lg shadow-sm overflow-hidden mb-8">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-indigo-800">Prochaines étapes</h3>
                  <div className="mt-2 max-w-xl text-sm text-indigo-600">
                    <p>Découvrez d&#39;autres ressources et outils pour vous aider à gérer votre stress.</p>
                  </div>
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Link
                        href="/resources"
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Consulter les ressources
                      </Link>
                    </div>
                    <div>
                      <Link
                        href="/info"
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Articles et informations
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Return button */}
              <div className="flex justify-center">
                <Link
                  href="/diagnostic"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Retour au diagnostic
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}

// Composant de chargement
function DiagnosticResultLoading() {
  return (
    <MainLayout>
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">Résultats de votre diagnostic de stress</h1>
            <p className="mt-2 text-lg text-gray-600">
              Chargement de vos résultats...
            </p>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-600">Chargement de vos résultats...</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}

// Composant principal avec Suspense
export default function DiagnosticResultPage() {
  return (
    <Suspense fallback={<DiagnosticResultLoading />}>
      <DiagnosticResultContent />
    </Suspense>
  );
} 