'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '../../../../components/MainLayout';
import { useAuth } from '../../../../context/AuthContext';
import { infoResourcesApi } from '../../../../services/api.service';

interface Comment {
  id: number;
  info_resource_id: number;
  user_id: number;
  message: string;
  comment_date: string;
  parent_id?: number | null;
  user_firstname?: string;
  user_lastname?: string;
  replies?: Comment[];
}

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likingInProgress, setLikingInProgress] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deletingComment, setDeletingComment] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [updatingComment, setUpdatingComment] = useState<number | null>(null);
  const [replyingToComment, setReplyingToComment] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    const fetchResource = async () => {
      try {
        setLoading(true);
        
        const response = await infoResourcesApi.getById(Number(params.id));
        setResource(response.data.resource);
        setLikeCount(response.data.resource.likes_count || 0);
        
        // Récupérer les commentaires
        const commentsResponse = await infoResourcesApi.getComments(Number(params.id));
          setResource((prev: any) => ({
            ...prev,
          comments: commentsResponse.data.comments || []
          }));
        
        // Vérifier si l'utilisateur a déjà liké cette ressource (si connecté)
        if (isAuthenticated) {
          try {
            const likeResponse = await infoResourcesApi.checkLiked(Number(params.id));
            setIsLiked(likeResponse.data.isLiked);
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
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Date inconnue';
    
    try {
      const date = new Date(dateString);
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Erreur de formatage de date:', error, 'pour la valeur:', dateString);
      return 'Date invalide';
    }
  };

  const formatUserName = (comment: Comment) => {
    if (comment.user_firstname && comment.user_lastname) {
      return `${comment.user_firstname} ${comment.user_lastname}`;
    }
    return 'Utilisateur anonyme';
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    try {
      setSubmittingComment(true);
      await infoResourcesApi.addComment(Number(params.id), commentText.trim());
      
      // Recharger les commentaires
      const commentsResponse = await infoResourcesApi.getComments(Number(params.id));
      setResource((prev: any) => ({
        ...prev,
        comments: commentsResponse.data.comments || [],
        comments_count: (prev.comments_count || 0) + 1
      }));
      
      setCommentText('');
      setSubmittingComment(false);
    } catch (err) {
      console.error('Erreur lors de l\'ajout du commentaire:', err);
      setSubmittingComment(false);
      alert("Erreur lors de l'ajout du commentaire. Veuillez réessayer.");
    }
  };

  const handleReplySubmit = async (parentId: number) => {
    if (!replyText.trim()) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    try {
      setSubmittingReply(true);
      
      // Utiliser l'API pour ajouter une réponse
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/api/info/resources/${params.id}/comments/${parentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: replyText.trim() }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      
      // Recharger les commentaires
      const commentsResponse = await infoResourcesApi.getComments(Number(params.id));
      setResource((prev: any) => ({
        ...prev,
        comments: commentsResponse.data.comments || [],
        comments_count: (prev.comments_count || 0) + 1
      }));
      
      setReplyText('');
      setReplyingToComment(null);
      setSubmittingReply(false);
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la réponse:', err);
      setSubmittingReply(false);
      alert("Erreur lors de l'ajout de la réponse. Veuillez réessayer.");
    }
  };

  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (likingInProgress) return;
    
    try {
      setLikingInProgress(true);
      const response = await infoResourcesApi.toggleLike(Number(params.id));
      
      const newLikedState = response.data.isLiked;
      setIsLiked(newLikedState);
      setLikeCount(prevCount => newLikedState ? prevCount + 1 : prevCount - 1);
      
    } catch (error) {
      console.error('Erreur lors de la gestion du like:', error);
      alert("Erreur lors de la gestion du like. Veuillez réessayer.");
    } finally {
      setLikingInProgress(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user) return;
    
    try {
      setDeletingComment(commentId);
      await infoResourcesApi.deleteComment(Number(params.id), commentId);
      
      // Recharger les commentaires
      const commentsResponse = await infoResourcesApi.getComments(Number(params.id));
        setResource((prev: any) => ({
          ...prev,
        comments: commentsResponse.data.comments || [],
        comments_count: Math.max(0, (prev.comments_count || 0) - 1)
        }));
      
      setShowDeleteModal(false);
      setCommentToDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression du commentaire:', error);
      alert("Erreur lors de la suppression du commentaire. Veuillez réessayer.");
    } finally {
      setDeletingComment(null);
    }
  };

  const confirmDeleteComment = (commentId: number) => {
    setCommentToDelete(commentId);
    setShowDeleteModal(true);
  };

  const cancelDeleteComment = () => {
    setShowDeleteModal(false);
    setCommentToDelete(null);
  };

  const startEditComment = (commentId: number, currentMessage: string) => {
    setEditingComment(commentId);
    setEditCommentText(currentMessage);
  };

  const cancelEditComment = () => {
    setEditingComment(null);
    setEditCommentText('');
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!user) return;

    if (!editCommentText.trim()) {
      alert('Le commentaire ne peut pas être vide.');
      return;
    }

    try {
      setUpdatingComment(commentId);
      await infoResourcesApi.updateComment(Number(params.id), commentId, editCommentText.trim());
      
      // Recharger les commentaires
      const commentsResponse = await infoResourcesApi.getComments(Number(params.id));
        setResource((prev: any) => ({
          ...prev,
        comments: commentsResponse.data.comments || []
        }));
      
      setEditingComment(null);
      setEditCommentText('');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du commentaire:', error);
      alert("Erreur lors de la mise à jour du commentaire. Veuillez réessayer.");
    } finally {
      setUpdatingComment(null);
    }
  };

  const startReply = (commentId: number) => {
    setReplyingToComment(commentId);
    setReplyText('');
  };

  const cancelReply = () => {
    setReplyingToComment(null);
    setReplyText('');
  };

  const canDeleteComment = (comment: Comment) => {
    if (!user) return false;
    return comment.user_id === user.id || user.role === 'admin';
  };

  const canEditComment = (comment: Comment) => {
    if (!user) return false;
    return comment.user_id === user.id;
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 mt-3' : 'mb-4'} bg-gray-50 p-4 rounded-lg`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
          <div className="font-medium text-gray-900">{formatUserName(comment)}</div>
                      <div className="text-sm text-gray-500 ml-2">
            {formatDate(comment.comment_date)}
                      </div>
                    </div>
                    
        {/* Boutons d'action */}
        {user && (
                      <div className="flex items-center gap-2">
                        {/* Bouton de modification */}
            {canEditComment(comment) && editingComment !== comment.id && (
                          <button
                            onClick={() => startEditComment(comment.id, comment.message)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50 transition-colors"
                            title="Modifier ce commentaire"
                          >
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        
                        {/* Bouton de suppression */}
            {canDeleteComment(comment) && (
                        <button
                          onClick={() => confirmDeleteComment(comment.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 transition-colors"
                          disabled={deletingComment === comment.id}
                          title="Supprimer ce commentaire"
                        >
                          {deletingComment === comment.id ? (
                            <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
            )}
                      </div>
                    )}
                  </div>
                  
                  {/* Contenu du commentaire ou interface d'édition */}
                  {editingComment === comment.id ? (
                    <div className="mt-2">
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        rows={3}
                        value={editCommentText}
                        onChange={(e) => setEditCommentText(e.target.value)}
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={cancelEditComment}
                          className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => handleUpdateComment(comment.id)}
                          className="px-3 py-1 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                          disabled={updatingComment === comment.id || !editCommentText.trim()}
                        >
              {updatingComment === comment.id ? 'Modification...' : 'Sauvegarder'}
                        </button>
                      </div>
                    </div>
                  ) : (
        <div>
                    <p className="text-gray-700">{comment.message}</p>
          
          {/* Bouton de réponse (seulement pour les commentaires principaux) */}
          {!isReply && isAuthenticated && (
            <div className="mt-3">
              <button
                onClick={() => startReply(comment.id)}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                Répondre
              </button>
            </div>
          )}
          
          {/* Interface de réponse */}
          {replyingToComment === comment.id && (
            <div className="mt-3 p-3 bg-white rounded-md border">
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder="Écrivez votre réponse..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={cancelReply}
                  className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleReplySubmit(comment.id)}
                  className="px-3 py-1 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                  disabled={submittingReply || !replyText.trim()}
                >
                  {submittingReply ? 'Envoi...' : 'Répondre'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Affichage des réponses */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
        </div>
      </MainLayout>
    );
  }

  if (!resource) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Ressource non trouvée</h1>
            <p className="mt-2 text-gray-600">La ressource que vous recherchez n'existe pas ou a été supprimée.</p>
            <Link href="/info/resources" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Retour aux ressources
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6">
            {/* En-tête de l'article */}
            <div className="border-b border-gray-200 pb-6 mb-6">
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {resource.category}
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mt-3">{resource.title}</h1>
              <p className="text-xl text-gray-600 mt-2">{resource.summary}</p>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {resource.reading_time || "5 min"}
                </div>
                <div className="text-sm text-gray-900">
                  {formatDate(resource.publication_date)}
                </div>
              </div>
            </div>

            {/* Contenu de l'article */}
            <div className="prose prose-indigo prose-lg max-w-none mb-8 text-gray-800" dangerouslySetInnerHTML={{ __html: resource.content }} />

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
                  <span>{resource.comments?.length || 0} Commentaires</span>
                </div>
              </div>
            </div>

            {/* Commentaires */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Commentaires ({resource.comments?.length || 0})</h2>
              
              {resource.comments?.map((comment: Comment) => renderComment(comment))}
              
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
                    {submittingComment ? 'Publication...' : 'Publier'}
                  </button>
                </div>
              ) : (
                <div className="mt-6 bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-700 mb-2">Connectez-vous pour ajouter un commentaire</p>
                  <Link href="/login" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Se connecter
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Modal de confirmation de suppression */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mt-3">Supprimer le commentaire</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action ne peut pas être annulée.
                  </p>
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  <button
                    onClick={cancelDeleteComment}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => commentToDelete && handleDeleteComment(commentToDelete)}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700 transition-colors"
                    disabled={deletingComment !== null}
                  >
                    {deletingComment !== null ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 