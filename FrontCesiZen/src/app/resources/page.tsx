'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MainLayout from '../../components/MainLayout';
import ReportButton from '../../components/ReportButton';
import { infoResourcesApi } from '../../services/api.service';
import { useAuth } from '../../context/AuthContext';

interface InfoResource {
  id: number;
  title: string;
  summary: string;
  category: string;
  reading_time?: string;
  level?: string;
  views: number;
  shares: number;
  tags?: string[];
}

export default function ResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<InfoResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await infoResourcesApi.getAll();
        setResources(response.data.resources || []); // L'API retourne { data: { resources: [...] } }
      } catch (err: any) {
        console.error("Failed to load resources:", err);
        setError(err.message || "Une erreur est survenue lors du chargement des ressources.");
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Ressources CesiZen
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Découvrez des articles et ressources pour améliorer votre bien-être mental et physique.
          </p>
          {user && (
            <div className="mt-6">
              <Link 
                href="/resources/new"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <span className="mr-2">+</span>
                Créer une ressource
              </Link>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="ml-4 text-lg text-gray-700">Chargement des ressources...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md text-center">
            <p className="text-red-700 font-semibold">Erreur de chargement</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && resources.length === 0 && (
          <div className="text-center py-10">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune ressource trouvée</h3>
            <p className="mt-1 text-sm text-gray-500">Revenez plus tard ou contactez le support si le problème persiste.</p>
          </div>
        )}

        {!loading && !error && resources.length > 0 && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <div key={resource.id} className="h-full flex flex-col overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
                <Link href={`/info/resources/${resource.id}`} className="flex-1 block group">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-indigo-700 group-hover:text-indigo-800 mb-2">{resource.title}</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Catégorie:</span> {resource.category}
                    </p>
                    {resource.level && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Niveau:</span> {resource.level}
                      </p>
                    )}
                    {resource.reading_time && (
                      <p className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Durée de lecture:</span> {resource.reading_time}
                      </p>
                    )}
                    <p className="text-gray-700 text-sm mb-4 line-clamp-3">{resource.summary}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                      <span>👁️ {resource.views} vues</span>
                      <span>📤 {resource.shares} partages</span>
                    </div>
                    <span className="mt-auto inline-block text-indigo-600 group-hover:text-indigo-500 font-medium">
                      Lire la ressource &rarr;
                    </span>
                  </div>
                </Link>
                
                {/* Bouton de signalement de la ressource */}
                <div className="px-6 pb-4">
                  <div className="flex justify-end">
                    <ReportButton 
                      contentType="resource" 
                      contentId={resource.id} 
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 