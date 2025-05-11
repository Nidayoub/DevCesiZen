'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/MainLayout';
import DiagnosticCard from '../components/DiagnosticCard';
import { useState, useEffect } from 'react';
import { DiagnosticResult } from '../types';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [lastDiagnostic, setLastDiagnostic] = useState<DiagnosticResult | null>(null);

  useEffect(() => {
    // Récupérer le dernier diagnostic depuis localStorage
    const storedDiagnostic = localStorage.getItem('diagnosticResult');
    if (storedDiagnostic) {
      try {
        setLastDiagnostic(JSON.parse(storedDiagnostic));
      } catch (err) {
        console.error('Erreur lors de la récupération des données du diagnostic:', err);
      }
    }
  }, []);

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-indigo-800 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:w-full lg:pb-28 xl:pb-32">
            <div className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                  <span className="block">Retrouvez votre sérénité</span>
                  <span className="block text-indigo-200">avec CESIZen</span>
                </h1>
                <p className="mt-3 text-base text-indigo-100 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Votre compagnon numérique pour la gestion du stress et l'amélioration du bien-être quotidien.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  {isAuthenticated ? (
                    <div className="rounded-md shadow">
                      <Link
                        href="/dashboard"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                      >
                        Accéder à mon tableau de bord
                      </Link>
                    </div>
                  ) : (
                    <div className="rounded-md shadow">
                      <Link
                        href="/diagnostic"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                      >
                        Évaluer mon stress
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 hidden lg:block lg:w-1/2">
            <div className="h-56 w-full bg-cover sm:h-72 md:h-96 lg:w-full lg:h-full" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1487700160041-babef9c3cb55?q=80&w=2070')", backgroundPosition: 'center', backgroundSize: 'cover', opacity: '0.6' }}></div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Fonctionnalités</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Une approche complète du bien-être
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Découvrez les outils que CESIZen met à votre disposition pour vous aider à gérer votre stress et améliorer votre bien-être.
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {/* Feature 1 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg font-medium text-gray-900">Diagnostic de Stress</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Évaluez votre niveau de stress avec notre outil basé sur l'échelle de Holmes et Rahe, et recevez des recommandations personnalisées.
                  </p>
                  <div className="mt-3">
                    <DiagnosticCard result={lastDiagnostic} />
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg font-medium text-gray-900">Suivi Personnalisé</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Suivez votre progression et obtenez des recommandations personnalisées basées sur vos résultats de diagnostic.
                  </p>
                  <div className="mt-3">
                    <Link href="/diagnostic" className="text-indigo-600 hover:text-indigo-500">
                      Faire un diagnostic →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg font-medium text-gray-900">Ressources et Activités</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Accédez à une bibliothèque de ressources et d'activités pour vous aider à gérer votre stress au quotidien.
                  </p>
                  <div className="mt-3">
                    <Link href="/resources" className="text-indigo-600 hover:text-indigo-500">
                      Découvrir les ressources →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg font-medium text-gray-900">Informations et Conseils</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Consultez nos articles sur le stress, ses effets et les meilleures pratiques pour préserver votre bien-être mental.
                  </p>
                  <div className="mt-3">
                    <Link href="/info" className="text-indigo-600 hover:text-indigo-500">
                      Lire nos articles →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            <span className="block">Prêt à améliorer votre bien-être ?</span>
            <span className="block text-indigo-600">Commencez dès aujourd'hui.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                href={isAuthenticated ? "/dashboard" : "/diagnostic"}
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {isAuthenticated ? "Tableau de bord" : "Commencer"}
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                href="/info"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
              >
                En savoir plus
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Footer Section */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">&copy; {new Date().getFullYear()} CESIZen. Tous droits réservés.</p>
            <div className="mt-4 md:mt-0">
              <Link href="/cgu" className="text-sm text-gray-300 hover:text-white mr-4">
                Conditions Générales d'Utilisation
              </Link>
              <Link href="/politique-de-confidentialite" className="text-sm text-gray-300 hover:text-white">
                Politique de confidentialité
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </MainLayout>
  );
}
