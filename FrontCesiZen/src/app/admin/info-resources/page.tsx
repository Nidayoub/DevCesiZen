'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '../../../components/MainLayout';
import { infoResourcesApi } from '../../../services/api.service';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';

interface InfoResource {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  publication_date: string;
  views: number;
  shares: number;
  likes_count: number;
  comments_count: number;
  tags?: string[];
}

export default function AdminInfoResourcesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [resources, setResources] = useState<InfoResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    if (isAuthenticated && user && user.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [isAuthenticated, user, router]);

  // Charger les ressources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const response = await infoResourcesApi.getAll(100, 0); // Récupérer jusqu'à 100 ressources
        setResources(response.data.resources);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération des ressources:', err);
        setError('Impossible de charger les ressources');
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.role === 'admin') {
      fetchResources();
    }
  }, [isAuthenticated, user]);

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  // Fonction pour supprimer une ressource
  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      setIsDeleting(true);
      await infoResourcesApi.delete(deleteId);
      setResources(resources.filter(resource => resource.id !== deleteId));
      setShowDeleteModal(false);
      setIsDeleting(false);
      setDeleteId(null);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setIsDeleting(false);
    }
  };

  // Si l'utilisateur n'est pas authentifié ou pas un admin, ne rien afficher
  if (!isAuthenticated || (user && user.role !== 'admin')) {
    return <MainLayout></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Gestion des ressources d'information</h1>
            <Link
              href="/admin/info-resources/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Créer une ressource
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
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
            <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
              <p className="text-gray-500">Aucune ressource d'information disponible</p>
              <p className="mt-2 text-sm text-gray-500">Commencez par créer votre première ressource</p>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Titre
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Catégorie
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Publication
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Interactions
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {resources.map((resource) => (
                          <tr key={resource.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{resource.title}</div>
                                  <div className="text-sm text-gray-500 truncate max-w-xs">{resource.summary}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                {resource.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(resource.publication_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex space-x-2">
                                <span className="flex items-center" title="Vues">
                                  <svg className="h-4 w-4 text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                  </svg>
                                  {resource.views}
                                </span>
                                <span className="flex items-center" title="Likes">
                                  <svg className="h-4 w-4 text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                  </svg>
                                  {resource.likes_count}
                                </span>
                                <span className="flex items-center" title="Commentaires">
                                  <svg className="h-4 w-4 text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                                  </svg>
                                  {resource.comments_count}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <Link
                                  href={`/info/resources/${resource.id}`}
                                  className="text-indigo-600 hover:text-indigo-900"
                                  target="_blank"
                                >
                                  Voir
                                </Link>
                                <Link
                                  href={`/admin/info-resources/edit/${resource.id}`}
                                  className="text-yellow-600 hover:text-yellow-900"
                                >
                                  Modifier
                                </Link>
                                <button
                                  onClick={() => {
                                    setDeleteId(resource.id);
                                    setShowDeleteModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Supprimer
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Supprimer la ressource</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Êtes-vous sûr de vouloir supprimer cette ressource ? Cette action est irréversible et supprimera également tous les commentaires et likes associés.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm ${isDeleting ? 'opacity-75 cursor-not-allowed' : ''}`}
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
} 