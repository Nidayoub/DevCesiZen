import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  Linking,
  TextInput,
  Image
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { infoResourcesApi } from '../services/api.service';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import ReportButton from '../components/ReportButton';

type ResourceDetailsRouteProp = RouteProp<RootStackParamList, 'ResourceDetails'>;

type ResourceDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ResourceDetails'>;

interface ResourceDetailsScreenProps {
  route: ResourceDetailsRouteProp;
  navigation: ResourceDetailsScreenNavigationProp;
}

interface Resource {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  publication_date: string;
  modification_date: string;
  reading_time: string;
  level: string;
  views: number;
  shares: number;
  likes_count: number;
  comments_count: number;
  tags: string[];
  author_id: number;
  media_type?: string;
  media_content?: string;
  media_filename?: string;
}

interface Comment {
  id: number;
  message: string;
  comment_date: string;
  user_firstname: string;
  user_lastname: string;
  user_id: number;
  parent_id?: number | null;
  replies?: Comment[];
}

const ResourceDetailsScreen: React.FC<ResourceDetailsScreenProps> = ({ route, navigation }) => {
  const { id } = route.params;
  const { user } = useAuth();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [likingInProgress, setLikingInProgress] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [replyingToComment, setReplyingToComment] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [addingReply, setAddingReply] = useState(false);
  const [deletingComment, setDeletingComment] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [updatingComment, setUpdatingComment] = useState<number | null>(null);

  useEffect(() => {
    loadResource();
    loadComments();
  }, [id]);

  // Réagir aux changements de l'utilisateur connecté
  useEffect(() => {
    if (resource) {
      // Vérifier le statut du like quand l'utilisateur change
      const checkLikeStatus = async () => {
        if (user) {
          try {
            console.log('User changed, checking like status for resource:', id);
            const likeResponse = await infoResourcesApi.checkLiked(id);
            console.log('Like response after user change:', likeResponse?.data);
            if (likeResponse?.data) {
              setLiked(likeResponse.data.isLiked);
              console.log('Set liked state to (user change):', likeResponse.data.isLiked);
            }
          } catch (err) {
            console.error('Error checking resource like status after user change:', err);
            setLiked(false);
          }
        } else {
          // Si l'utilisateur se déconnecte, réinitialiser le like
          setLiked(false);
        }
      };
      
      checkLikeStatus();
    }
  }, [user, id, resource]);

  const loadResource = async () => {
    try {
      setLoading(true);
      const response = await infoResourcesApi.getById(id);
      
      if (response?.data && response.data.resource) {
        setResource(response.data.resource);
        
        // Check if the resource is liked
        if (user) {
          try {
            console.log('Checking like status for resource:', id);
            const likeResponse = await infoResourcesApi.checkLiked(id);
            console.log('Like response:', likeResponse?.data);
            if (likeResponse?.data) {
              setLiked(likeResponse.data.isLiked);
              console.log('Set liked state to:', likeResponse.data.isLiked);
            }
          } catch (err) {
            console.error('Error checking resource like status:', err);
            // Si l'API échoue, on garde l'état liked à false
            setLiked(false);
          }
        } else {
          // Si pas d'utilisateur connecté, état non-liké
          setLiked(false);
        }
      } else {
        console.log('Unexpected resource data format:', response);
        setError('Impossible de charger les détails de la ressource.');
      }
    } catch (err) {
      console.error('Error loading resource:', err);
              setError('Erreur lors du chargement de la ressource. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      setCommentsLoading(true);
      const response = await infoResourcesApi.getComments(id);
      
      if (response?.data && response.data.comments) {
        setComments(response.data.comments);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const addComment = async () => {
    if (!user) {
              Alert.alert('Authentification requise', 'Veuillez vous connecter pour ajouter des commentaires.');
      return;
    }

    if (!newComment.trim()) {
              Alert.alert('Erreur', 'Veuillez saisir un commentaire.');
      return;
    }

    try {
      setAddingComment(true);
      await infoResourcesApi.addComment(id, newComment.trim());
      setNewComment('');
      
      // Reload comments to show the new one
      await loadComments();
      
      // Update comment count in resource
      if (resource) {
        setResource({
          ...resource,
          comments_count: resource.comments_count + 1
        });
      }
    } catch (err) {
      console.error('Error adding comment:', err);
              Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire. Veuillez réessayer.');
    } finally {
      setAddingComment(false);
    }
  };

  const addReply = async (parentCommentId: number) => {
    if (!user) {
      Alert.alert('Authentification requise', 'Veuillez vous connecter pour répondre aux commentaires.');
      return;
    }

    if (!replyText.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir une réponse.');
      return;
    }

    try {
      setAddingReply(true);
      await infoResourcesApi.addReply(id, parentCommentId, replyText.trim());
      setReplyText('');
      setReplyingToComment(null);
      
      // Reload comments to show the new reply
      await loadComments();
      
      // Update comment count in resource
      if (resource) {
        setResource({
          ...resource,
          comments_count: resource.comments_count + 1
        });
      }
    } catch (err) {
      console.error('Error adding reply:', err);
      Alert.alert('Erreur', 'Impossible d\'ajouter la réponse. Veuillez réessayer.');
    } finally {
      setAddingReply(false);
    }
  };

  const deleteComment = async (commentId: number) => {
    if (!user) {
      Alert.alert('Authentification requise', 'Veuillez vous connecter pour supprimer des commentaires.');
      return;
    }

    try {
      setDeletingComment(commentId);
      await infoResourcesApi.deleteComment(id, commentId);
      
      // Reload comments to update the list
      await loadComments();
      
      // Reload resource to get updated comment count (important car la suppression peut inclure des réponses)
      await loadResource();
    } catch (err) {
      console.error('Error deleting comment:', err);
      Alert.alert('Erreur', 'Impossible de supprimer le commentaire. Veuillez réessayer.');
    } finally {
      setDeletingComment(null);
    }
  };

  const confirmDeleteComment = (commentId: number) => {
    Alert.alert(
      'Supprimer le commentaire',
      'Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action ne peut pas être annulée.',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteComment(commentId)
        }
      ]
    );
  };

  const startEditComment = (commentId: number, currentMessage: string) => {
    setEditingComment(commentId);
    setEditCommentText(currentMessage);
  };

  const cancelEditComment = () => {
    setEditingComment(null);
    setEditCommentText('');
  };

  const updateComment = async (commentId: number) => {
    if (!user) {
      Alert.alert('Authentification requise', 'Veuillez vous connecter pour modifier des commentaires.');
      return;
    }

    if (!editCommentText.trim()) {
      Alert.alert('Erreur', 'Le commentaire ne peut pas être vide.');
      return;
    }

    try {
      setUpdatingComment(commentId);
      await infoResourcesApi.updateComment(id, commentId, editCommentText.trim());
      
      // Reload comments to show the updated comment
      await loadComments();
      
      setEditingComment(null);
      setEditCommentText('');
    } catch (err) {
      console.error('Error updating comment:', err);
      Alert.alert('Erreur', 'Impossible de modifier le commentaire. Veuillez réessayer.');
    } finally {
      setUpdatingComment(null);
    }
  };

  const handleReplyPress = (commentId: number) => {
    setReplyingToComment(commentId);
    setReplyText('');
  };

  const cancelReply = () => {
    setReplyingToComment(null);
    setReplyText('');
  };

  const handleLike = async () => {
    if (!user) {
              Alert.alert('Authentification requise', 'Veuillez vous connecter pour aimer les ressources.');
      return;
    }

    // Empêcher les clics multiples
    if (likingInProgress) {
      return;
    }

    try {
      setLikingInProgress(true);
      const response = await infoResourcesApi.toggleLike(id);
      if (response?.data) {
        const newLikedState = response.data.isLiked;
        setLiked(newLikedState);
        
        // Update like count in resource - utiliser le NOUVEL état, pas l'ancien
        if (resource) {
          setResource({
            ...resource,
            likes_count: newLikedState ? resource.likes_count + 1 : resource.likes_count - 1
          });
        }
      }
    } catch (err) {
      console.error('Error toggling like:', err);
              Alert.alert('Erreur', 'Impossible d\'aimer la ressource. Veuillez réessayer.');
    } finally {
      setLikingInProgress(false);
    }
  };

  const handleShare = async () => {
    if (!resource) return;

    try {
      await infoResourcesApi.incrementShares(id);
      
      // Increment share count locally
      setResource({
        ...resource,
        shares: resource.shares + 1
      });
      
      // Share the resource
      await Share.share({
        message: `Check out this resource: ${resource.title}\n\n${resource.summary}`,
        title: resource.title,
      });
    } catch (err) {
      console.error('Error sharing resource:', err);
    }
  };

  const handleDelete = async () => {
    if (!resource) return;
    
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cette ressource ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await infoResourcesApi.delete(resource.id);
              Alert.alert('Succès', 'Ressource supprimée avec succès', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Error deleting resource:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la ressource');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch (e) {
      return 'Unknown date';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Chargement de la ressource...</Text>
      </View>
    );
  }

  if (error || !resource) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error || 'Ressource introuvable'}</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Create a HTML renderer to display the content properly
  const createHtmlContent = () => {
    return { __html: resource.content };
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.category}>
          <Text style={styles.categoryText}>{resource.category}</Text>
        </View>
        
        <Text style={styles.title}>{resource.title}</Text>
        
        <Text style={styles.summary}>{resource.summary}</Text>
        
        <View style={styles.metadata}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text style={styles.metaText}>{resource.reading_time}</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="stats-chart-outline" size={16} color="#6b7280" />
            <Text style={styles.metaText}>{resource.level}</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.metaText}>{formatDate(resource.publication_date)}</Text>
          </View>
        </View>
      </View>
      
      {/* Media Display */}
      {resource.media_content && (
        <View style={styles.mediaContainer}>
          {resource.media_type === 'image' ? (
            <Image
              source={{ uri: resource.media_content }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
          ) : resource.media_type === 'video' ? (
            <View style={styles.videoContainer}>
              <Text style={styles.videoText}>Vidéo: {resource.media_filename}</Text>
              <Text style={styles.videoSubtext}>Lecture non prise en charge actuellement</Text>
            </View>
          ) : null}
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={styles.contentText}>
          {/* Strip HTML tags for simple viewing */}
          {resource.content.replace(/<[^>]*>?/gm, '')}
        </Text>
      </View>
      
      <View style={styles.tags}>
        {resource.tags && resource.tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
      
      {/* Author Actions (Edit/Delete) */}
      {user && user.id === resource.author_id && (
        <View style={styles.authorActions}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditResource', { resourceId: resource.id })}
          >
            <Ionicons name="create-outline" size={20} color="#4f46e5" />
            <Text style={styles.editButtonText}>Modifier</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text style={styles.deleteButtonText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            liked && styles.likedButton,
            likingInProgress && styles.actionButtonDisabled
          ]} 
          onPress={handleLike}
          disabled={likingInProgress}
        >
          {likingInProgress ? (
            <ActivityIndicator size="small" color={liked ? "#ffffff" : "#4f46e5"} />
          ) : (
          <Ionicons 
            name={liked ? "heart" : "heart-outline"} 
            size={20} 
            color={liked ? "#ffffff" : "#4f46e5"} 
          />
          )}
          <Text style={[styles.actionText, liked && styles.likedText]}>
            {resource.likes_count} Like{resource.likes_count !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={20} color="#4f46e5" />
          <Text style={styles.actionText}>
            {resource.shares} Share{resource.shares !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#4f46e5" />
          <Text style={styles.actionText}>
            {resource.comments_count} Comment{resource.comments_count !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
        
        <ReportButton 
          contentType="resource" 
          contentId={resource.id}
          style={styles.actionButton}
        />
      </View>

      {/* Comments Section */}
      <View style={styles.commentsSection}>
        <Text style={styles.commentsTitle}>Commentaires ({resource.comments_count})</Text>
        
        {/* Add Comment (for authenticated users only) */}
        {user ? (
          <View style={styles.addCommentContainer}>
            <TextInput
              style={styles.commentInput}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Ajouter un commentaire..."
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity 
              style={[styles.addCommentButton, !newComment.trim() && styles.addCommentButtonDisabled]}
              onPress={addComment}
              disabled={addingComment || !newComment.trim()}
            >
              {addingComment ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.addCommentButtonText}>Publier</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptText}>
              Connectez-vous pour ajouter un commentaire
            </Text>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginButtonText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Comments List */}
        {commentsLoading ? (
          <View style={styles.commentsLoadingContainer}>
            <ActivityIndicator color="#4f46e5" />
            <Text style={styles.commentsLoadingText}>Chargement des commentaires...</Text>
          </View>
        ) : comments.length > 0 ? (
          <View style={styles.commentsList}>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentAuthorInfo}>
                    <Text style={styles.commentAuthor}>
                      {comment.user_firstname} {comment.user_lastname}
                    </Text>
                    <Text style={styles.commentDate}>
                      {new Date(comment.comment_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  
                  {/* Action buttons */}
                  <View style={styles.commentActions}>
                    {/* Report Button for all users */}
                    <ReportButton 
                      contentType="comment" 
                      contentId={comment.id}
                      size="small"
                    />
                    
                    {/* Edit/Delete buttons for comment owner or admin */}
                    {user && (comment.user_id === user.id || user.role === 'admin') && (
                      <>
                        {/* Edit Button for comment owner only */}
                        {comment.user_id === user.id && editingComment !== comment.id && (
                          <TouchableOpacity 
                            style={styles.commentEditButton}
                            onPress={() => startEditComment(comment.id, comment.message)}
                          >
                            <Ionicons name="pencil-outline" size={16} color="#4f46e5" />
                          </TouchableOpacity>
                        )}
                        
                        {/* Delete Button for comment owner or admin */}
                        <TouchableOpacity 
                          style={styles.commentDeleteButton}
                          onPress={() => confirmDeleteComment(comment.id)}
                          disabled={deletingComment === comment.id}
                        >
                          {deletingComment === comment.id ? (
                            <ActivityIndicator size="small" color="#ef4444" />
                          ) : (
                            <Ionicons name="trash-outline" size={16} color="#ef4444" />
                          )}
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
                
                {/* Comment content or edit interface */}
                {editingComment === comment.id ? (
                  <View style={styles.editCommentContainer}>
                    <TextInput
                      style={styles.editCommentInput}
                      value={editCommentText}
                      onChangeText={setEditCommentText}
                      placeholder="Modifier votre commentaire..."
                      multiline
                      numberOfLines={3}
                    />
                    <View style={styles.editCommentActions}>
                      <TouchableOpacity 
                        style={styles.cancelEditButton}
                        onPress={cancelEditComment}
                      >
                        <Text style={styles.cancelEditButtonText}>Annuler</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.saveEditButton, !editCommentText.trim() && styles.saveEditButtonDisabled]}
                        onPress={() => updateComment(comment.id)}
                        disabled={updatingComment === comment.id || !editCommentText.trim()}
                      >
                        {updatingComment === comment.id ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <Text style={styles.saveEditButtonText}>Sauvegarder</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.commentText}>{comment.message}</Text>
                )}
                
                {/* Reply Button */}
                {user && editingComment !== comment.id && (
                  <TouchableOpacity 
                    style={styles.replyButton}
                    onPress={() => handleReplyPress(comment.id)}
                  >
                    <Ionicons name="arrow-undo" size={16} color="#4f46e5" />
                    <Text style={styles.replyButtonText}>Répondre</Text>
                  </TouchableOpacity>
                )}

                {/* Reply Input */}
                {replyingToComment === comment.id && (
                  <View style={styles.replyInputContainer}>
                    <TextInput
                      style={styles.replyInput}
                      value={replyText}
                      onChangeText={setReplyText}
                      placeholder="Écrire une réponse..."
                      multiline
                      numberOfLines={2}
                    />
                    <View style={styles.replyButtonsContainer}>
                      <TouchableOpacity 
                        style={styles.cancelReplyButton}
                        onPress={cancelReply}
                      >
                        <Text style={styles.cancelReplyButtonText}>Annuler</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.submitReplyButton, !replyText.trim() && styles.submitReplyButtonDisabled]}
                        onPress={() => addReply(comment.id)}
                        disabled={addingReply || !replyText.trim()}
                      >
                        {addingReply ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <Text style={styles.submitReplyButtonText}>Publier</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <View style={styles.repliesContainer}>
                    {comment.replies.map((reply) => (
                      <View key={reply.id} style={styles.replyItem}>
                        <View style={styles.replyHeader}>
                          <View style={styles.commentAuthorInfo}>
                            <Text style={styles.replyAuthor}>
                              {reply.user_firstname} {reply.user_lastname}
                            </Text>
                            <Text style={styles.replyDate}>
                              {new Date(reply.comment_date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>
                          </View>
                          
                          {/* Action buttons */}
                          <View style={styles.commentActions}>
                            {/* Report Button for all users */}
                            <ReportButton 
                              contentType="comment" 
                              contentId={reply.id}
                              size="small"
                            />
                            
                            {/* Edit/Delete buttons for reply owner or admin */}
                            {user && (reply.user_id === user.id || user.role === 'admin') && (
                              <>
                                {/* Edit Button for reply owner only */}
                                {reply.user_id === user.id && editingComment !== reply.id && (
                                  <TouchableOpacity 
                                    style={styles.commentEditButton}
                                    onPress={() => startEditComment(reply.id, reply.message)}
                                  >
                                    <Ionicons name="pencil-outline" size={14} color="#4f46e5" />
                                  </TouchableOpacity>
                                )}
                                
                                {/* Delete Button for reply owner or admin */}
                                <TouchableOpacity 
                                  style={styles.commentDeleteButton}
                                  onPress={() => confirmDeleteComment(reply.id)}
                                  disabled={deletingComment === reply.id}
                                >
                                  {deletingComment === reply.id ? (
                                    <ActivityIndicator size="small" color="#ef4444" />
                                  ) : (
                                    <Ionicons name="trash-outline" size={14} color="#ef4444" />
                                  )}
                                </TouchableOpacity>
                              </>
                            )}
                          </View>
                        </View>
                        
                        {/* Reply content or edit interface */}
                        {editingComment === reply.id ? (
                          <View style={styles.editCommentContainer}>
                            <TextInput
                              style={styles.editCommentInput}
                              value={editCommentText}
                              onChangeText={setEditCommentText}
                              placeholder="Modifier votre réponse..."
                              multiline
                              numberOfLines={2}
                            />
                            <View style={styles.editCommentActions}>
                              <TouchableOpacity 
                                style={styles.cancelEditButton}
                                onPress={cancelEditComment}
                              >
                                <Text style={styles.cancelEditButtonText}>Annuler</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={[styles.saveEditButton, !editCommentText.trim() && styles.saveEditButtonDisabled]}
                                onPress={() => updateComment(reply.id)}
                                disabled={updatingComment === reply.id || !editCommentText.trim()}
                              >
                                {updatingComment === reply.id ? (
                                  <ActivityIndicator color="#ffffff" size="small" />
                                ) : (
                                  <Text style={styles.saveEditButtonText}>Sauvegarder</Text>
                                )}
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <Text style={styles.replyText}>{reply.message}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noCommentsContainer}>
            <Text style={styles.noCommentsText}>Aucun commentaire pour le moment.</Text>
            <Text style={styles.noCommentsSubtext}>
              {user ? 'Soyez le premier à commenter !' : 'Connectez-vous pour commenter.'}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  category: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },
  summary: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 16,
    lineHeight: 24,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  metaText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    padding: 16,
  },
  contentText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    paddingTop: 8,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#6b7280',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4f46e5',
  },
  likedButton: {
    backgroundColor: '#4f46e5',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '500',
  },
  likedText: {
    color: '#ffffff',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  // Comments Section Styles
  commentsSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  addCommentContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  addCommentButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addCommentButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  addCommentButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  loginPrompt: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  loginPromptText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  commentsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  commentsLoadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  commentsList: {
    marginBottom: 16,
  },
  commentItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
  },
  commentDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  commentAuthorInfo: {
    flex: 1,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentEditButton: {
    padding: 4,
    borderRadius: 4,
  },
  commentDeleteButton: {
    padding: 4,
    borderRadius: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noCommentsText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  // Media Styles
  mediaContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  videoContainer: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  videoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  videoSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  // Author Actions Styles
  authorActions: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    justifyContent: 'space-around',
    backgroundColor: '#f9fafb',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#4f46e5',
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  editButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  deleteButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  // Reply Styles
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  replyButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '500',
  },
  replyInputContainer: {
    marginTop: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },
  replyButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelReplyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  cancelReplyButtonText: {
    color: '#6b7280',
    fontWeight: '500',
    fontSize: 14,
  },
  submitReplyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#4f46e5',
  },
  submitReplyButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitReplyButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 14,
  },
  repliesContainer: {
    marginTop: 12,
    marginLeft: 16,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#e5e7eb',
  },
  replyItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4f46e5',
  },
  replyDate: {
    fontSize: 10,
    color: '#9ca3af',
  },
  replyText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  // Edit Comment Styles
  editCommentContainer: {
    marginTop: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  editCommentInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },
  editCommentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelEditButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  cancelEditButtonText: {
    color: '#6b7280',
    fontWeight: '500',
    fontSize: 14,
  },
  saveEditButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#4f46e5',
  },
  saveEditButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveEditButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 14,
  },
});

export default ResourceDetailsScreen; 