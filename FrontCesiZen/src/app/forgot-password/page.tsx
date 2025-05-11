'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Veuillez saisir votre adresse email');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await authService.forgotPassword(email);
      setSuccessMessage(result.message);
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
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Récupération de mot de passe</h1>
        
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md">
            {successMessage}
            <p className="mt-2 text-sm">Vérifiez votre boîte de réception et suivez les instructions dans l'email.</p>
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
            {errorMessage}
          </div>
        )}
        
        {!successMessage && (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Entrez votre adresse email"
                disabled={isSubmitting}
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
            </div>
            
            <div className="mb-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
              </button>
            </div>
          </form>
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