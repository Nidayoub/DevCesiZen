'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '../../../../components/MainLayout';
import { useAuth } from '../../../../context/AuthContext';

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const fetchResource = async () => {
      try {
        setLoading(true);
        
        // Appel à l'API pour récupérer la ressource
        const resourceResponse = await fetch(`http://localhost:3000/api/info/resources/${params.id}`);
        
        if (!resourceResponse.ok) {
          throw new Error(`Erreur de récupération de la ressource: ${resourceResponse.status}`);
        }
        
        const resourceData = await resourceResponse.json();
        setResource(resourceData.resource);
        setLikeCount(resourceData.resource.likes_count);
        
        // Récupérer les commentaires
        const commentsResponse = await fetch(`http://localhost:3000/api/info/resources/${params.id}/comments`);
        
        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          setResource(prev => ({
            ...prev,
            comments: commentsData.comments
          }));
        }
        
        // Vérifier si l'utilisateur a déjà liké cette ressource (si connecté)
        if (isAuthenticated) {
          try {
            const likeResponse = await fetch(`http://localhost:3000/api/info/resources/${params.id}/likes`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (likeResponse.ok) {
              const likeData = await likeResponse.json();
              setIsLiked(likeData.isLiked);
            }
          } catch (error) {
            console.error('Erreur lors de la vérification du like:', error);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération de la ressource:', err);
        setError('Impossible de charger la ressource. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };

    fetchResource();
  }, [params.id, isAuthenticated]);

  // Formater la date pour l'affichage
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    
    try {
      setSubmittingComment(true);
      
      // Appel à l'API pour ajouter un commentaire
      const response = await fetch(`http://localhost:3000/api/info/resources/${params.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: commentText })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Rafraîchir la page pour afficher le commentaire ajouté
      window.location.reload();
      
      // Réinitialisation du formulaire
      setCommentText('');
      setSubmittingComment(false);
    } catch (err) {
      console.error('Erreur lors de l\'ajout du commentaire:', err);
      setSubmittingComment(false);
      alert("Erreur lors de l'ajout du commentaire. Veuillez réessayer.");
    }
  };

  const handleLikeToggle = async () => {
    if (isAuthenticated) {
      try {
        // Appel à l'API pour ajouter/retirer un like
        const response = await fetch(`http://localhost:3000/api/info/resources/${params.id}/likes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Erreur: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Mettre à jour l'état avec les données renvoyées par l'API
        setIsLiked(data.isLiked);
        
        // Rafraîchir la page pour avoir le compte exact
        window.location.reload();
      } catch (error) {
        console.error('Erreur lors de la gestion du like:', error);
        alert("Erreur lors de la gestion du like. Veuillez réessayer.");
      }
    } else {
      // Rediriger vers la page de connexion
      router.push('/auth/login');
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
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
        ) : resource && (
          <div>
            {/* Fil d'Ariane */}
            <nav className="text-sm font-medium mb-6" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li>
                  <Link href="/" className="text-gray-500 hover:text-gray-700">
                    Accueil
                  </Link>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </li>
                <li>
                  <Link href="/info/resources" className="text-gray-500 hover:text-gray-700">
                    Ressources
                  </Link>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </li>
                <li>
                  <span className="text-gray-700">{resource.title}</span>
                </li>
              </ol>
            </nav>

            {/* En-tête de l'article */}
            <div className="mb-8">
              <div className="flex items-center mb-2">
                <Link
                  href={`/info/resources?category=${encodeURIComponent(resource.category)}`}
                  className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                >
                  {resource.category}
                </Link>
                
                <span className="ml-2 text-sm text-gray-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {resource.reading_time} de lecture
                </span>
                
                <span className="ml-2 text-sm text-gray-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {resource.level}
                </span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{resource.title}</h1>
              
              <p className="mt-2 text-xl text-gray-500">{resource.summary}</p>
              
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <time dateTime={resource.publication_date}>
                  Publié le {formatDate(resource.publication_date)}
                </time>
                
                {resource.modification_date !== resource.publication_date && (
                  <span className="ml-2">
                    • Mis à jour le {formatDate(resource.modification_date)}
                  </span>
                )}
              </div>
              
              <div className="mt-4 flex flex-wrap gap-1">
                {resource.tags?.map((tag: string) => (
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

            {/* Contenu de l'article */}
            <div className="prose prose-indigo prose-lg max-w-none mb-8 text-gray-800 prose-headings:text-gray-900 prose-p:text-gray-700" dangerouslySetInnerHTML={{ __html: resource.content }} />

            {/* Interactions */}
            <div className="border-t border-gray-200 pt-6 mt-8">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={handleLikeToggle}
                  className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                    isLiked ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg 
                    className={`w-5 h-5 mr-2 ${isLiked ? 'text-pink-600' : 'text-gray-400'}`}
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span>{likeCount} J'aime</span>
                </button>
                
                <div className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                  <span>{resource.comments_count} Commentaires</span>
                </div>
                
                <div className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  <span>{resource.shares} Partages</span>
                </div>
                
                <div className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  <span>{resource.views} Vues</span>
                </div>
              </div>
            </div>

            {/* Commentaires */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Commentaires ({resource.comments?.length || 0})</h2>
              
              {resource.comments?.map((comment: any) => (
                <div key={comment.id} className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center mb-2">
                    <div className="font-medium text-gray-900">{comment.user_name}</div>
                    <div className="text-sm text-gray-500 ml-2">
                      {formatDate(comment.created_at)}
                    </div>
                  </div>
                  <p className="text-gray-700">{comment.message}</p>
                </div>
              ))}
              
              {isAuthenticated ? (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ajouter un commentaire</h3>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                    placeholder="Partagez votre avis..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  ></textarea>
                  <button
                    onClick={handleCommentSubmit}
                    className="mt-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={submittingComment}
                  >
                    Publier
                  </button>
                </div>
              ) : (
                <div className="mt-6 bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-700 mb-2">Connectez-vous pour ajouter un commentaire</p>
                  <Link href="/auth/login" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Se connecter
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 