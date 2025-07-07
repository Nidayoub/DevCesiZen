'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';

// Composant qui utilise useSearchParams, enveloppé dans Suspense
function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetParams, setResetParams] = useState<{
    id: string;
    timestamp: string;
    expiry: string;
    token: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [tokenError, setTokenError] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Récupérer les paramètres depuis l'URL
    const id = searchParams.get('id');
    const timestamp = searchParams.get('timestamp');
    const expiry = searchParams.get('expiry');
    const token = searchParams.get('token');
    
    if (!id || !timestamp || !expiry || !token) {
      setTokenError(true);
      setErrorMessage('Lien de réinitialisation invalide ou incomplet.');
      return;
    }
    
    // Vérifier si le token est expiré
    const now = Date.now();
    if (now > parseInt(expiry)) {
      setTokenError(true);
      setErrorMessage('Ce lien de réinitialisation a expiré.');
      return;
    }
    
    setResetParams({ id, timestamp, expiry, token });
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!password || !confirmPassword) {
      setErrorMessage('Veuillez remplir tous les champs');
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (password.length < 8) {
      setErrorMessage('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (!resetParams) {
      setErrorMessage('Paramètres de réinitialisation manquants');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await authService.resetPassword(
        resetParams.id,
        resetParams.timestamp,
        resetParams.expiry,
        resetParams.token,
        password
      );
      setSuccessMessage(result.message);
      
      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Une erreur est survenue');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Réinitialisation du mot de passe</h1>
        
        {tokenError ? (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
            <p>{errorMessage}</p>
            <p className="mt-4">
              <Link href="/forgot-password" className="text-blue-600 hover:underline">
                Demander un nouveau lien de réinitialisation
              </Link>
            </p>
          </div>
        ) : (
          <>
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md">
                <p>{successMessage}</p>
                <p className="mt-2">Vous allez être redirigé vers la page de connexion...</p>
              </div>
            )}
            
            {errorMessage && !successMessage && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
                {errorMessage}
              </div>
            )}
            
            {!successMessage && (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Nouveau mot de passe
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Votre nouveau mot de passe"
                    disabled={isSubmitting}
                    required
                    minLength={8}
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le mot de passe
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirmez votre nouveau mot de passe"
                    disabled={isSubmitting}
                    required
                    minLength={8}
                  />
                </div>
                
                <div className="mb-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
        
        <div className="text-center text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

// Composant de chargement
function ResetPasswordLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    </div>
  );
}

// Composant principal avec Suspense
export default function ResetPassword() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordForm />
    </Suspense>
  );
} 