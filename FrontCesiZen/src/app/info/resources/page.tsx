'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '../../../components/MainLayout';
import { infoResourcesApi } from '../../../services/api.service';
import Link from 'next/link';

interface InfoResource {
  id: number;
  title: string;
  summary: string;
  category: string;
  publication_date: string;
  reading_time?: string;
  level?: string;
  views: number;
  shares: number;
  likes_count: number;
  comments_count: number;
  tags?: string[];
}

export default function InfoResourcesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const tag = searchParams.get('tag');

  const [resources, setResources] = useState<InfoResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tags, setTags] = useState<{id: number, name: string}[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // URL de base pour toutes les requêtes API
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        console.log('API Base URL:', apiBaseUrl);
        
        let resourcesData = [];
        
        // Récupérer les ressources en fonction des filtres
        let url;
        if (category) {
          url = `${apiBaseUrl}/api/info/resources/category/${encodeURIComponent(category)}`;
        } else if (tag) {
          url = `${apiBaseUrl}/api/info/resources/tag/${encodeURIComponent(tag)}`;
        } else {
          url = `${apiBaseUrl}/api/info/resources`;
        }
        
        console.log('Fetching resources from:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API Error: ${response.status} - ${errorText}`);
          throw new Error(`Erreur lors de la récupération des données: ${response.status}`);
        }
        
        const data = await response.json();
        resourcesData = data.resources;
        setResources(resourcesData);
        
        // Récupérer les tags disponibles
        const tagsResponse = await fetch(`${apiBaseUrl}/api/info/tags`);
        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json();
          setTags(tagsData.tags);
        }
        
        // Extraire les catégories uniques des ressources
        const uniqueCategories = Array.from(
          new Set(resourcesData.map((res: InfoResource) => res.category))
        );
        setCategories(uniqueCategories);
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération des ressources:', err);
        setError(`Impossible de charger les ressources: ${err.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [category, tag]);

  // Formater la date pour l'affichage
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Articles et Informations
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Découvrez nos articles sur le stress, ses effets et comment améliorer votre bien-être mental.
          </p>
        </div>

        {/* Filtres */}
        <div className="mt-8 mb-10">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link 
              href="/info/resources" 
              className={`px-4 py-2 rounded-full text-sm font-medium ${!category && !tag ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            >
              Tous
            </Link>
            
            {categories.map((cat) => (
              <Link 
                key={cat} 
                href={`/info/resources?category=${encodeURIComponent(cat)}`}
                className={`px-4 py-2 rounded-full text-sm font-medium ${category === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              >
                {cat}
              </Link>
            ))}
          </div>

          {/* Tags populaires */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {tags.slice(0, 10).map((tag) => (
              <Link 
                key={tag.id} 
                href={`/info/resources?tag=${encodeURIComponent(tag.name)}`}
                className={`px-3 py-1 rounded-full text-xs font-medium ${searchParams.get('tag') === tag.name ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center mt-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
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
        ) : resources.length === 0 ? (
          <div className="text-center mt-16">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="mt-2 text-xl font-medium text-gray-900">Aucune ressource trouvée</h3>
            <p className="mt-1 text-gray-500">Essayez de modifier vos filtres ou revenez plus tard.</p>
          </div>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <div key={resource.id} className="flex flex-col overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-indigo-600">
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                        {resource.category}
                      </span>
                    </p>
                    <Link href={`/info/resources/${resource.id}`} className="block mt-2">
                      <h3 className="text-xl font-semibold text-gray-900 hover:text-indigo-600">{resource.title}</h3>
                      <p className="mt-3 text-base text-gray-500">{resource.summary}</p>
                    </Link>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {resource.tags?.map((tag) => (
                        <Link 
                          key={tag} 
                          href={`/info/resources?tag=${encodeURIComponent(tag)}`}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 flex items-center">
                    <div className="flex-1 flex divide-x divide-gray-200 text-sm text-gray-500">
                      <div className="flex items-center pr-3">
                        <svg className="w-4 h-4 mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {resource.reading_time || "5 min"}
                      </div>
                      <div className="flex items-center px-3">
                        <svg className="w-4 h-4 mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {resource.views}
                      </div>
                      <div className="flex items-center px-3">
                        <svg className="w-4 h-4 mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {resource.likes_count}
                      </div>
                      <div className="flex items-center pl-3">
                        <svg className="w-4 h-4 mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        {resource.comments_count}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <div className="font-medium text-sm text-gray-900">
                        {formatDate(resource.publication_date)}
                      </div>
                    </div>
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