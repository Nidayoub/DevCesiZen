'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '../../components/MainLayout';
import StyledInput from '../../components/StyledInput';
import { useAuth } from '../../context/AuthContext';
import { RegisterData } from '../../types/user';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading } = useAuth();
  
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    firstname: '',
    lastname: '',
  });
  
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    firstname?: string;
    lastname?: string;
    form?: string;
  }>({});
  
  const [passwordConfirm, setPasswordConfirm] = useState('');
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const validateForm = () => {
    const newErrors: typeof errors = {};
    let isValid = true;
    
    // Validation du prénom
    if (!formData.firstname.trim()) {
      newErrors.firstname = 'Le prénom est requis';
      isValid = false;
    } else if (formData.firstname.length < 2) {
      newErrors.firstname = 'Le prénom doit contenir au moins 2 caractères';
      isValid = false;
    }
    
    // Validation du nom
    if (!formData.lastname.trim()) {
      newErrors.lastname = 'Le nom est requis';
      isValid = false;
    } else if (formData.lastname.length < 2) {
      newErrors.lastname = 'Le nom doit contenir au moins 2 caractères';
      isValid = false;
    }
    
    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Veuillez entrer une adresse email valide';
      isValid = false;
    }
    
    // Validation du mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      isValid = false;
    }
    
    // Validation de la confirmation du mot de passe
    if (formData.password !== passwordConfirm) {
      newErrors.password = 'Les mots de passe ne correspondent pas';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
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
  
  const handlePasswordConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordConfirm(e.target.value);
    
    // Effacer l'erreur de confirmation si besoin
    if (errors.password && formData.password === e.target.value) {
      setErrors({
        ...errors,
        password: undefined,
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Réinitialiser l'erreur de formulaire
    setErrors({ ...errors, form: undefined });
    
    // Valider le formulaire
    if (!validateForm()) {
      return;
    }
    
    try {
      const result = await register(formData);
      
      if (result && result.message) {
        setIsSuccess(true);
        setSuccessMessage(result.message);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      setErrors({
        ...errors,
        form: 'Erreur lors de l\'inscription. Veuillez réessayer.'
      });
    }
  };
  
  return (
    <MainLayout>
      <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Créez votre compte</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              connectez-vous à votre compte existant
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {isSuccess ? (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900">Inscription réussie !</h3>
                <div className="mt-4 border-l-4 border-yellow-400 bg-yellow-50 p-4 text-left">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Important !</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Vous devez vérifier votre adresse email pour activer votre compte.</p>
                        <p className="mt-1">Un lien d'activation a été envoyé à votre adresse email. Veuillez cliquer sur ce lien pour finaliser votre inscription.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  {successMessage}
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  <p>Vérifiez votre boîte de réception et vos spams.</p>
                  <p className="mt-1">Vous ne pourrez pas vous connecter tant que vous n'aurez pas vérifié votre email.</p>
                </div>
                <div className="mt-6">
                  <Link href="/login" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Aller à la page de connexion
                  </Link>
                </div>
              </div>
            ) : (
              <>
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
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <StyledInput
                      id="firstname"
                      name="firstname"
                      type="text"
                      label="Prénom"
                      autoComplete="given-name"
                      required
                      value={formData.firstname}
                      onChange={handleInputChange}
                      error={errors.firstname}
                    />

                    <StyledInput
                      id="lastname"
                      name="lastname"
                      type="text"
                      label="Nom"
                      autoComplete="family-name"
                      required
                      value={formData.lastname}
                      onChange={handleInputChange}
                      error={errors.lastname}
                    />
                  </div>

                  <StyledInput
                    id="email"
                    name="email"
                    type="email"
                    label="Adresse email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    error={errors.email}
                  />

                  <StyledInput
                    id="password"
                    name="password"
                    type="password"
                    label="Mot de passe"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    error={errors.password}
                  />

                  <StyledInput
                    id="passwordConfirm"
                    name="passwordConfirm"
                    type="password"
                    label="Confirmer le mot de passe"
                    autoComplete="new-password"
                    required
                    value={passwordConfirm}
                    onChange={handlePasswordConfirmChange}
                    error={errors.password && passwordConfirm !== formData.password ? errors.password : undefined}
                  />

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
                          Inscription en cours...
                        </>
                      ) : 'S\'inscrire'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 