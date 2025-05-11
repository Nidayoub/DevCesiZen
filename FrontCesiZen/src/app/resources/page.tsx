'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MainLayout from '../../components/MainLayout'; // Ajustez le chemin si nécessaire
import { breathingApi } from '../../services/api.service'; // Ajustez le chemin si nécessaire

interface BreathingExerciseSummary {
  id: number;
  name: string;
  description: string;
  type: string;
  difficulty: string;
  duration: number; // en minutes
  iconName?: string;
}

export default function BreathingExercisesPage() {
  const [exercises, setExercises] = useState<BreathingExerciseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await breathingApi.getAllExercises();
        setExercises(response.exercises || []); // L'API enveloppe les exercices dans un objet { exercises: [...] }
      } catch (err: any) {
        console.error("Failed to load breathing exercises:", err);
        setError(err.message || "Une erreur est survenue lors du chargement des exercices.");
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, []);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Exercices de Respiration
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Découvrez des techniques de respiration pour vous aider à gérer le stress et à améliorer votre bien-être.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="ml-4 text-lg text-gray-700">Chargement des exercices...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md text-center">
            <p className="text-red-700 font-semibold">Erreur de chargement</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && exercises.length === 0 && (
          <div className="text-center py-10">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun exercice trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">Revenez plus tard ou contactez le support si le problème persiste.</p>
          </div>
        )}

        {!loading && !error && exercises.length > 0 && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {exercises.map((exercise) => (
              <Link key={exercise.id} href={`/resources/${exercise.id}`} className="block group">
                <div className="h-full flex flex-col overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
                  <div className="p-6">
                    {/* Vous pouvez ajouter une icône ici si disponible, ex: exercise.iconName */}
                    <h3 className="text-xl font-semibold text-indigo-700 group-hover:text-indigo-800 mb-2">{exercise.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Type:</span> {exercise.type}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Difficulté:</span> {exercise.difficulty}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Durée:</span> {exercise.duration} min
                    </p>
                    <p className="text-gray-700 text-sm mb-4 line-clamp-3">{exercise.description}</p>
                    <span className="mt-auto inline-block text-indigo-600 group-hover:text-indigo-500 font-medium">
                      Commencer l'exercice &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 