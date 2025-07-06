'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MainLayout from '../../components/MainLayout';
import { breathingApi } from '../../services/api.service';

interface BreathingExercise {
  id: number;
  name: string;
  description: string;
  type: string;
  difficulty: string;
  duration: number;
}

export default function BreathingExercisesPage() {
  const [exercises, setExercises] = useState<BreathingExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await breathingApi.getAllExercises();
        setExercises(response.exercises || []);
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
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
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
              <div key={exercise.id} className="block group bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
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
                  <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors">
                    Commencer l'exercice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 