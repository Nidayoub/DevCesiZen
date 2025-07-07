'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '../../components/MainLayout';

// Composant qui utilise useSearchParams, enveloppé dans Suspense
function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Vérification de votre adresse email...');

  useEffect(() => {
    async function verifyEmail() {
      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setMessage('Token de vérification manquant');
        return;
      }

      try {
        // Backend API is running on port 3000, frontend on port 3001
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        console.log(`Tentative de vérification avec le token: ${token}`);
        console.log(`URL complète: ${apiUrl}/api/auth/verify-email?token=${token}`);

        const response = await fetch(`${apiUrl}/api/auth/verify-email?token=${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        console.log('Statut de la réponse:', response.status);
        const data = await response.json();
        console.log('Données reçues:', data);

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Votre adresse email a été vérifiée avec succès!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Échec de la vérification de votre adresse email');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'email:', error);
        setStatus('error');
        setMessage('Une erreur est survenue lors de la vérification de votre adresse email. Veuillez vérifier que le serveur backend est en cours d\'exécution.');
      }
    }

    verifyEmail();
  }, [searchParams]);

  const handleRedirect = () => {
    router.push('/login');
  };

  return (
    <MainLayout>
      <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Vérification d'email
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {status === 'loading' && (
              <div className="flex flex-col items-center">
                <svg className="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-center text-gray-700">{message}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{message}</p>
                  </div>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{message}</p>
                    <p className="text-sm text-red-700 mt-2">Token: {searchParams.get('token')?.substring(0, 10)}...</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6">
              {status !== 'loading' && (
                <button
                  onClick={handleRedirect}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Aller à la page de connexion
                </button>
              )}
            </div>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-500">
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Composant de chargement
function VerifyEmailLoading() {
  return (
    <MainLayout>
      <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Vérification d'email
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex flex-col items-center">
              <svg className="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-center text-gray-700">Chargement de la vérification...</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Composant principal avec Suspense
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  );
} 