'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import MainLayout from '../../../components/MainLayout';
import ReportButton from '../../../components/ReportButton';
import { infoApi } from '../../../services/api.service';
import { InfoPage } from '../../../types';

export default function InfoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [pageInfo, setPageInfo] = useState<InfoPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  useEffect(() => {
    async function fetchPageInfo() {
      if (!slug) {
        router.push('/info');
        return;
      }

      try {
        setLoading(true);
        const response = await infoApi.getBySlug(slug as string);
        
        console.log('Réponse API info détail:', response.data);
        
        // Vérifier que la réponse contient bien les données de la page
        if (response.data && response.data.page) {
          setPageInfo(response.data.page);
        } else {
          console.error('Format de données inattendu:', response.data);
          setError('La page demandée est introuvable ou inaccessible.');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement de l\'article:', err);
        setError('Erreur lors du chargement de l\'article. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    }

    fetchPageInfo();
  }, [slug, router]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <MainLayout>
      <div className="py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Link
                  href="/info"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Retour aux articles
                </Link>
              </div>
            </div>
          ) : pageInfo ? (
            <>
              <Link
                href="/info"
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 mb-6"
              >
                <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Retour aux articles
              </Link>
              
              <article className="bg-white shadow overflow-hidden rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h1 className="text-3xl font-bold text-gray-900 leading-tight">{pageInfo.title}</h1>
                  
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span>Mis à jour le {formatDate(pageInfo.updated_at)}</span>
                  </div>
                  
                  {pageInfo.category && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {pageInfo.category}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6 prose prose-indigo max-w-none">
                  <ReactMarkdown>{pageInfo.content}</ReactMarkdown>
                </div>
                
                <div className="border-t border-gray-200 px-4 py-3 sm:px-6">
                  <div className="flex justify-end">
                    <ReportButton 
                      contentType="resource" 
                      contentId={pageInfo.id} 
                      className="text-xs"
                    />
                  </div>
                </div>
                
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <div className="flex justify-between items-center">
                    <Link
                      href="/info"
                      className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Tous les articles
                    </Link>
                    
                    <Link
                      href="/diagnostic"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Évaluer mon stress
                    </Link>
                  </div>
                </div>
              </article>
            </>
          ) : (
            <div className="text-center py-10">
              <h3 className="mt-2 text-base font-semibold text-gray-900">Article non trouvé</h3>
              <p className="mt-1 text-sm text-gray-500">L&#39;article que vous cherchez n&#39;existe pas ou a été supprimé.</p>
              <div className="mt-6">
                <Link
                  href="/info"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Voir tous les articles
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
} 