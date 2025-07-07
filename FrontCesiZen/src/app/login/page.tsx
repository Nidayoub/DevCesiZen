'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '../../components/MainLayout';
import StyledInput from '../../components/StyledInput';
import { useAuth } from '../../context/AuthContext';
import { LoginCredentials } from '../../types/user';

// Composant qui utilise useSearchParams, enveloppé dans Suspense
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loading } = useAuth();
  
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});
  
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState<{
    loading: boolean;
    success?: string;
    error?: string;
  }>({ loading: false });
  
  const validateForm = () => {
    const newErrors: typeof errors = {};
    let isValid = true;
    
    // Validation de l'email
    if (!credentials.email.trim()) {
      newErrors.email = 'L&#39;email est requis';
      isValid = false;
    }
    
    // Validation du mot de passe
    if (!credentials.password) {
      newErrors.password = 'Le mot de passe est requis';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value,
    });
    
    // Effacer l'erreur du champ modifié
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Réinitialiser l'erreur de formulaire et l'option de renvoi de vérification
    setErrors({ ...errors, form: undefined });
    setShowResendVerification(false);
    setResendStatus({ loading: false });
    
    // Valider le formulaire
    if (!validateForm()) {
      return;
    }
    
    try {
      await login(credentials);
      router.push(redirectTo);
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      let errorMessage = 'Identifiants incorrects. Veuillez vérifier votre email et mot de passe.';
      
      // Déterminer si l'erreur est liée à une adresse email non vérifiée
      if (error instanceof Error && error.message.includes('vérifier votre adresse email')) {
        errorMessage = error.message;
        setShowResendVerification(true);
      }
      
      setErrors({
        ...errors,
        form: errorMessage
      });
    }
  };
  
  const handleResendVerification = async () => {
    if (!credentials.email) {
      setResendStatus({
        loading: false,
        error: 'Veuillez entrer votre adresse email'
      });
      return;
    }
    
    setResendStatus({ loading: true });
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: credentials.email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResendStatus({
          loading: false,
          success: data.message || 'Email de vérification envoyé avec succès'
        });
      } else {
        setResendStatus({
          loading: false,
          error: data.error || 'Erreur lors de l&#39;envoi de l&#39;email de vérification'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la demande de renvoi:', error);
      setResendStatus({
        loading: false,
        error: 'Erreur de connexion au serveur'
      });
    }
  };
  
  return (
    <MainLayout>
      <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Connectez-vous à votre compte</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              créez un nouveau compte
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {errors.form && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{errors.form}</p>
                  </div>
                </div>
              </div>
            )}
            
            {showResendVerification && (
              <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4">
                <div className="flex mb-2">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">Vous n&#39;avez pas reçu l&#39;email de vérification ?</p>
                  </div>
                </div>
                
                {resendStatus.success ? (
                  <div className="bg-green-50 border-l-4 border-green-500 p-3 ml-8">
                    <p className="text-sm text-green-700">{resendStatus.success}</p>
                  </div>
                ) : resendStatus.error ? (
                  <div className="bg-red-50 border-l-4 border-red-500 p-3 ml-8">
                    <p className="text-sm text-red-700">{resendStatus.error}</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendStatus.loading}
                    className="ml-8 flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendStatus.loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Envoi en cours...
                      </>
                    ) : 'Renvoyer l&#39;email de vérification'}
                  </button>
                )}
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <StyledInput
                id="email"
                name="email"
                type="email"
                label="Adresse email"
                autoComplete="email"
                required
                value={credentials.email}
                onChange={handleInputChange}
                error={errors.email}
              />

              <StyledInput
                id="password"
                name="password"
                type="password"
                label="Mot de passe"
                autoComplete="current-password"
                required
                value={credentials.password}
                onChange={handleInputChange}
                error={errors.password}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Se souvenir de moi
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Mot de passe oublié ?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connexion en cours...
                    </>
                  ) : 'Se connecter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Composant de chargement
function LoginLoading() {
  return (
    <MainLayout>
      <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Connectez-vous à votre compte</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Chargement...</p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex justify-center items-center h-32">
              <div className="text-center">
                <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600">Chargement de la page de connexion...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Composant principal avec Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
} 