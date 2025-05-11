'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import MainLayout from '../../../components/MainLayout';
import { breathingApi } from '../../../services/api.service';
import Link from 'next/link';

interface BreathingStep {
  name: string;
  duration: number; // en secondes
  instruction: string;
}

interface BreathingExerciseDetail {
  id: number;
  name: string;
  description: string;
  type: string;
  steps: BreathingStep[];
  benefits: string[];
  difficulty: 'débutant' | 'intermédiaire' | 'avancé';
  duration: number; // en minutes
  iconName?: string;
  // Ajoutez d'autres champs si votre API les renvoie
}

export default function BreathingExerciseDetailPage() {
  const params = useParams();
  const exerciseId = params.id as string;

  const [exercise, setExercise] = useState<BreathingExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!exerciseId) return;

    const fetchExerciseDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await breathingApi.getExerciseById(exerciseId);
        setExercise(response.exercise || null); // L'API enveloppe l'exercice dans { exercise: { ... } }
      } catch (err: any) {
        console.error(`Failed to load breathing exercise ${exerciseId}:`, err);
        setError(err.message || "Une erreur est survenue lors du chargement de l'exercice.");
      } finally {
        setLoading(false);
      }
    };
    fetchExerciseDetail();
  }, [exerciseId]);

  // Simple timer component (optional, for guided steps)
  const StepTimer = ({ durationSeconds, onComplete }: { durationSeconds: number; onComplete?: () => void }) => {
    const [timeLeft, setTimeLeft] = useState(durationSeconds);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
      let interval: NodeJS.Timeout | null = null;
      if (isActive && timeLeft > 0) {
        interval = setInterval(() => {
          setTimeLeft((prevTime) => prevTime - 1);
        }, 1000);
      } else if (timeLeft === 0) {
        if (interval) clearInterval(interval);
        setIsActive(false);
        if (onComplete) onComplete();
      }
      return () => { if (interval) clearInterval(interval); };
    }, [isActive, timeLeft, onComplete]);

    const startTimer = () => {
      setTimeLeft(durationSeconds); // Reset timer
      setIsActive(true);
    };

    return (
      <div className="ml-auto flex items-center">
        {isActive ? (
          <span className="text-lg font-semibold text-indigo-600 tabular-nums">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
        ) : (
          <button 
            onClick={startTimer} 
            className="px-3 py-1 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-colors"
          >
            Démarrer ({durationSeconds}s)
          </button>
        )}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="ml-4 text-lg text-gray-700">Chargement de l'exercice...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-md shadow-md text-center">
            <h2 className="text-xl font-bold mb-2">Erreur de chargement</h2>
            <p>{error}</p>
            <Link href="/resources" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 underline">
              &larr; Retour à la liste des exercices
            </Link>
          </div>
        )}

        {!loading && !error && !exercise && (
          <div className="text-center py-20">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mt-4 text-2xl font-semibold text-gray-700">Exercice non trouvé</h2>
            <p className="mt-2 text-gray-500">Désolé, nous n'avons pas pu trouver l'exercice demandé.</p>
            <Link href="/resources" className="mt-6 inline-block px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
              Voir tous les exercices
            </Link>
          </div>
        )}

        {!loading && exercise && (
          <article className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="p-6 sm:p-8">
              {/* Breadcrumbs */}
              <nav className="text-sm mb-6">
                <Link href="/resources" className="text-indigo-600 hover:underline">Exercices de respiration</Link>
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-600">{exercise.name}</span>
              </nav>

              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{exercise.name}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 mb-6">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-medium">{exercise.type}</span>
                <span className="inline-flex items-center">Difficulté: <strong className="ml-1">{exercise.difficulty}</strong></span>
                <span className="inline-flex items-center">Durée: <strong className="ml-1">{exercise.duration} min</strong></span>
              </div>
              
              <p className="text-gray-700 text-lg leading-relaxed mb-8">{exercise.description}</p>

              <div className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Comment pratiquer :</h2>
                <ul className="space-y-5">
                  {exercise.steps.map((step, index) => (
                    <li key={index} className="p-4 bg-gray-50 rounded-lg shadow-sm flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-500 text-white rounded-full flex items-center justify-center text-lg font-bold">
                        {index + 1}
                      </div>
                      <div className="ml-4 flex-grow">
                        <h3 className="text-md font-semibold text-gray-900">{step.name} ({step.duration}s)</h3>
                        <p className="text-sm text-gray-600">{step.instruction}</p>
                      </div>
                      {/* Optional: Add StepTimer component here if you want interactive timers per step */}
                       <StepTimer durationSeconds={step.duration} />
                    </li>
                  ))}
                </ul>
              </div>

              {exercise.benefits && exercise.benefits.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Bienfaits :</h2>
                  <ul className="space-y-2 list-disc list-inside pl-2 text-gray-700">
                    {exercise.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-10 text-center">
                <Link href="/resources" className="px-6 py-3 text-base font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">
                  Explorer d'autres exercices
                </Link>
              </div>
            </div>
          </article>
        )}
      </div>
    </MainLayout>
  );
} 