'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import MainLayout from '../../../components/MainLayout';
import AdminMenu from '../../../components/AdminMenu';
import { diagnosticApi, diagnosticCategoriesApi } from '../../../services/api.service';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface DiagnosticQuestion {
  id: number;
  title: string;
  score: number;
  category_id?: number;
  category?: DiagnosticCategory;
  order?: number;
}

interface DiagnosticCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export default function AdminDiagnosticPage() {
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [diagnosticCategories, setDiagnosticCategories] = useState<DiagnosticCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'categories'>('questions');
  
  // États pour les questions
  const [showEditModal, setShowEditModal] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState<DiagnosticQuestion | null>(null);
  const [editedTitle, setEditedTitle] = useState<string>('');
  const [editedScore, setEditedScore] = useState<number>(0);
  const [editedCategoryId, setEditedCategoryId] = useState<number | undefined>(undefined);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newScore, setNewScore] = useState<number>(0);
  const [newCategoryId, setNewCategoryId] = useState<number | undefined>(undefined);
  
  // États pour les catégories
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<DiagnosticCategory | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState<string>('');
  const [editedCategoryDescription, setEditedCategoryDescription] = useState<string>('');

  // Charger les catégories de diagnostic
  const loadDiagnosticCategories = async () => {
    try {
      const response = await diagnosticCategoriesApi.getAll();
      setDiagnosticCategories(response.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des catégories de diagnostic:', err);
      setError('Impossible de charger les catégories de diagnostic');
    }
  };

  // Charger les questions de diagnostic
  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await diagnosticApi.getQuestions();
      
      // Le backend renvoie { events: [...] } avec title, points, category
      const events = response.data?.events || [];
      const fetched: DiagnosticQuestion[] = events.map((event: any) => ({
        id: event.id,
        title: event.title || event.event_text || '',
        score: event.points || 0,
        category_id: event.category_id || undefined,
        // Associer la catégorie si elle existe
        category: event.category_id ? diagnosticCategories.find(cat => cat.id === event.category_id) : undefined
      }));
      
      setQuestions(fetched);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des questions:', err);
      setError('Impossible de charger les questions de diagnostic. Veuillez réessayer.');
      setLoading(false);
    }
  };

  // Grouper les questions par catégorie
  const getQuestionsByCategory = () => {
    const grouped: { [key: string]: { questions: DiagnosticQuestion[], category: DiagnosticCategory | null } } = {};
    
    // Ajouter les questions avec catégories
    questions.forEach(question => {
      const categoryName = question.category?.name || 'Sans catégorie';
      if (!grouped[categoryName]) {
        grouped[categoryName] = {
          questions: [],
          category: question.category || null
        };
      }
      grouped[categoryName].questions.push(question);
    });
    
    // Trier les questions dans chaque catégorie par score décroissant
    Object.keys(grouped).forEach(categoryName => {
      grouped[categoryName].questions.sort((a, b) => b.score - a.score);
    });
    
    return grouped;
  };

  // Charger automatiquement les données au chargement de la page
  useEffect(() => {
    const loadData = async () => {
      await loadDiagnosticCategories();
      await loadQuestions();
    };
    loadData();
  }, []);

  // Modifier une question
  const handleUpdateQuestion = async () => {
    if (!questionToEdit) return;
    
    try {
      setLoading(true);
      
      // Trouver la catégorie sélectionnée
      const selectedCategory = editedCategoryId ? diagnosticCategories.find(cat => cat.id === editedCategoryId) : undefined;
      
      // Préparer les données de la question mise à jour
      const updatedQuestions = questions.map(q => {
        if (q.id === questionToEdit.id) {
          return {
            ...q,
            title: editedTitle,
            score: editedScore,
            category_id: editedCategoryId,
            category: selectedCategory
          };
        }
        return q;
      });
      
      // Convertir au format attendu par le backend
      const eventsForBackend = updatedQuestions.map(q => ({
        id: q.id,
        title: q.title,
        points: q.score,
        category_id: q.category_id || null
      }));
      
      // Envoyer les questions mises à jour à l'API
      await diagnosticApi.configureQuestions({ events: eventsForBackend });
      
      // Mettre à jour l'état local
      setQuestions(updatedQuestions);
      
      toast.success('Question mise à jour avec succès');
      setShowEditModal(false);
      setQuestionToEdit(null);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la modification de la question:', err);
      toast.error('Impossible de modifier la question');
      setLoading(false);
    }
  };

  // Ajouter une nouvelle question
  const handleAddQuestion = async () => {
    if (!newTitle || newScore <= 0) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }
    
    try {
      setLoading(true);
      
      // Créer la nouvelle question
      const list = questions || [];
      const selectedCategory = newCategoryId ? diagnosticCategories.find(cat => cat.id === newCategoryId) : undefined;
      
      const newQuestionObject: DiagnosticQuestion = {
        id: Math.max(...list.map(q => q.id), 0) + 1, // Générer un ID temporaire
        title: newTitle,
        score: newScore,
        category_id: newCategoryId,
        category: selectedCategory,
        order: list.length + 1
      };
      
      // Ajouter la question à la liste existante
      const updatedQuestions = [...list, newQuestionObject];
      
      // Convertir au format attendu par le backend
      const eventsForBackend = updatedQuestions.map(q => ({
        id: q.id,
        title: q.title,
        points: q.score,
        category_id: q.category_id || null
      }));
      
      // Envoyer les questions mises à jour à l'API
      await diagnosticApi.configureQuestions({ events: eventsForBackend });
      
      // Mettre à jour l'état local
      setQuestions(updatedQuestions);
      
      toast.success('Nouvelle question ajoutée avec succès');
      setShowAddModal(false);
      setNewTitle('');
      setNewScore(0);
      setNewCategoryId(undefined);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la question:', err);
      toast.error('Impossible d\'ajouter la question');
      setLoading(false);
    }
  };

  // Supprimer une question
  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette question ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Filtrer la question à supprimer
      const updatedQuestions = (questions || []).filter(q => q.id !== questionId);
      
      // Convertir au format attendu par le backend
      const eventsForBackend = updatedQuestions.map(q => ({
        id: q.id,
        title: q.title,
        points: q.score,
        category: q.category || 'Autre'
      }));
      
      // Envoyer les questions mises à jour à l'API
      await diagnosticApi.configureQuestions({ events: eventsForBackend });
      
      // Mettre à jour l'état local
      setQuestions(updatedQuestions);
      
      toast.success('Question supprimée avec succès');
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la suppression de la question:', err);
      toast.error('Impossible de supprimer la question');
      setLoading(false);
    }
  };

  // Ouvrir le modal d'édition
  const openEditModal = (question: DiagnosticQuestion) => {
    setQuestionToEdit(question);
    setEditedTitle(question.title);
    setEditedScore(question.score);
    setEditedCategoryId(question.category_id);
    setShowEditModal(true);
  };

  // Ouvrir le modal d'ajout
  const openAddModal = () => {
    setNewTitle('');
    setNewScore(0);
    setNewCategoryId(undefined);
    setShowAddModal(true);
  };

  // Fonctions pour gérer les catégories
  const openAddCategoryModal = () => {
    setIsAddingCategory(true);
    setCategoryToEdit(null);
    setEditedCategoryName('');
    setEditedCategoryDescription('');
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (category: DiagnosticCategory) => {
    setIsAddingCategory(false);
    setCategoryToEdit(category);
    setEditedCategoryName(category.name);
    setEditedCategoryDescription(category.description || '');
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    if (!editedCategoryName.trim()) {
      toast.error('Le nom de la catégorie est requis');
      return;
    }
    
    try {
      setLoading(true);
      
      if (isAddingCategory) {
        // Ajouter une nouvelle catégorie
        await diagnosticCategoriesApi.create({
          name: editedCategoryName.trim(),
          description: editedCategoryDescription.trim() || null,
          icon: '📝', // Icône par défaut
          color: '#6B7280' // Couleur par défaut
        });
        toast.success('Catégorie ajoutée avec succès');
      } else if (categoryToEdit) {
        // Modifier une catégorie existante
        await diagnosticCategoriesApi.update(categoryToEdit.id, {
          name: editedCategoryName.trim(),
          description: editedCategoryDescription.trim() || null
        });
        toast.success('Catégorie modifiée avec succès');
      }
      
      // Recharger les catégories
      await loadDiagnosticCategories();
      
      // Fermer le modal
      setShowCategoryModal(false);
      setEditedCategoryName('');
      setEditedCategoryDescription('');
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de la catégorie:', err);
      toast.error('Impossible de sauvegarder la catégorie');
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      setLoading(true);
      await diagnosticCategoriesApi.delete(categoryId);
      toast.success('Catégorie supprimée avec succès');
      
      // Recharger les catégories
      await loadDiagnosticCategories();
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la suppression de la catégorie:', err);
      toast.error('Impossible de supprimer la catégorie');
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/4">
              <AdminMenu />
            </div>
            <div className="md:w-3/4">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="sm:flex sm:items-center mb-6">
                  <div className="sm:flex-auto">
                    <h1 className="text-xl font-semibold text-gray-900">Administration du Diagnostic</h1>
                    <p className="mt-2 text-sm text-gray-700">
                      Gérez les questions et catégories utilisées dans l'échelle de stress de Holmes & Rahe
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex space-x-2">
                    <button
                      onClick={loadQuestions}
                      disabled={loading}
                      className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      {loading ? 'Chargement...' : 'Rafraîchir'}
                    </button>
                    {activeTab === 'questions' && (
                      <button
                        onClick={openAddModal}
                        disabled={loading}
                        className="inline-flex items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-6 py-3 text-sm font-medium text-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200"
                      >
                        ✨ Ajouter une question
                      </button>
                    )}
                  </div>
                </div>

                {/* Onglets */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('questions')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'questions'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Questions par catégorie
                    </button>
                    <button
                      onClick={() => setActiveTab('categories')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'categories'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Gestion des catégories
                    </button>
                  </nav>
                </div>
                
                {error && (
                  <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
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
                
                {/* Contenu des onglets */}
                {activeTab === 'questions' ? (
                  loading && (questions?.length ?? 0) === 0 ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                      <span className="ml-2">Chargement des questions...</span>
                    </div>
                  ) : (questions?.length ?? 0) === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Aucune question trouvée</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(getQuestionsByCategory()).map(([categoryName, categoryData]) => (
                        <div key={categoryName} className="bg-white shadow rounded-lg">
                          <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                              {categoryData.category && (
                                <span className="text-2xl mr-2" style={{ color: categoryData.category.color }}>
                                  {categoryData.category.icon}
                                </span>
                              )}
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mr-3">
                                {categoryData.questions.length}
                              </span>
                              {categoryName}
                            </h3>
                            <div className="space-y-3">
                              {categoryData.questions.map((question) => (
                                <div key={question.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                  <div className="flex-1">
                                    <p className="text-sm text-gray-900 mr-4">{question.title}</p>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      {question.score} pts
                                    </span>
                                    <div className="flex space-x-2">
                                      <button 
                                        onClick={() => openEditModal(question)}
                                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                      >
                                        Modifier
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteQuestion(question.id)}
                                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                                      >
                                        Supprimer
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🏷️</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Gestion des catégories
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Gérez les catégories de diagnostic et de ressources depuis une interface dédiée.
                      </p>
                      <Link 
                        href="/admin/categories"
                        className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        🏷️ Aller à la gestion des catégories
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Modal d'édition */}
        {showEditModal && (
          <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                aria-hidden="true"
                onClick={() => setShowEditModal(false)}
              ></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Modifier la question</h3>
                      <div className="mt-6 space-y-6">
                        <div>
                          <label htmlFor="question-title" className="block text-sm font-medium text-gray-700 mb-2">
                            📝 Titre de la question *
                          </label>
                          <textarea
                            id="question-title"
                            name="question-title"
                            rows={3}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 transition-all duration-200 hover:border-gray-400"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            placeholder="Entrez le titre de votre question..."
                          />
                        </div>
                        <div>
                          <label htmlFor="question-score" className="block text-sm font-medium text-gray-700 mb-2">
                            🎯 Score associé *
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            id="question-score"
                            name="question-score"
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 transition-all duration-200 hover:border-gray-400"
                            value={editedScore || ''}
                            onChange={(e) => setEditedScore(Number(e.target.value))}
                            placeholder="Score de 0 à 100"
                          />
                        </div>
                        <div>
                          <label htmlFor="question-category" className="block text-sm font-medium text-gray-700 mb-2">
                            📂 Catégorie
                          </label>
                          <select
                            id="question-category"
                            name="question-category"
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 transition-all duration-200 hover:border-gray-400"
                            value={editedCategoryId || ''}
                            onChange={(e) => setEditedCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                          >
                            <option value="">Aucune catégorie</option>
                            {diagnosticCategories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.icon} {category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button 
                    type="button"
                    className="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-6 py-3 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                    onClick={handleUpdateQuestion}
                    disabled={loading || !editedTitle}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        💾 Enregistrer
                      </>
                    )}
                  </button>
                  <button 
                    type="button"
                    className="mt-3 w-full inline-flex justify-center items-center rounded-lg border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                    onClick={() => setShowEditModal(false)}
                    disabled={loading}
                  >
                    ❌ Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal d'ajout */}
        {showAddModal && (
          <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="add-modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                aria-hidden="true"
                onClick={() => setShowAddModal(false)}
              ></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">✨ Ajouter une nouvelle question</h3>
                      <div className="mt-6 space-y-6">
                        <div>
                          <label htmlFor="new-question-title" className="block text-sm font-medium text-gray-700 mb-2">
                            📝 Titre de la question *
                          </label>
                          <textarea
                            id="new-question-title"
                            name="new-question-title"
                            rows={3}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-4 py-2 transition-all duration-200 hover:border-gray-400"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Entrez le titre de votre question..."
                            required
                          />
                          <p className="mt-1 text-xs text-gray-500">Exemple: "Je me sens stressé(e) au travail"</p>
                        </div>
                        <div>
                          <label htmlFor="new-question-score" className="block text-sm font-medium text-gray-700 mb-2">
                            🎯 Score associé *
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            id="new-question-score"
                            name="new-question-score"
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-4 py-2 transition-all duration-200 hover:border-gray-400"
                            value={newScore || ''}
                            onChange={(e) => setNewScore(Number(e.target.value))}
                            placeholder="Score de 0 à 100"
                            required
                          />
                          <p className="mt-1 text-xs text-gray-500">Plus le score est élevé, plus la question indique un problème</p>
                        </div>
                        <div>
                          <label htmlFor="new-question-category" className="block text-sm font-medium text-gray-700 mb-2">
                            📂 Catégorie
                          </label>
                          <select
                            id="new-question-category"
                            name="new-question-category"
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-4 py-2 transition-all duration-200 hover:border-gray-400"
                            value={newCategoryId || ''}
                            onChange={(e) => setNewCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                          >
                            <option value="">Aucune catégorie</option>
                            {diagnosticCategories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.icon} {category.name}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-gray-500">Optionnel - aide à organiser les questions</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button 
                    type="button"
                    className="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-6 py-3 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                    onClick={handleAddQuestion}
                    disabled={loading || !newTitle || newScore <= 0}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Ajout en cours...
                      </>
                    ) : (
                      <>
                        ✨ Ajouter la question
                      </>
                    )}
                  </button>
                  <button 
                    type="button"
                    className="mt-3 w-full inline-flex justify-center items-center rounded-lg border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                    onClick={() => setShowAddModal(false)}
                    disabled={loading}
                  >
                    ❌ Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de gestion des catégories */}
        {showCategoryModal && (
          <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="category-modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                aria-hidden="true"
                onClick={() => setShowCategoryModal(false)}
              ></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="category-modal-title">
                        {isAddingCategory ? 'Ajouter une catégorie' : 'Modifier la catégorie'}
                      </h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="category-name" className="block text-sm font-medium text-gray-700">
                            Nom de la catégorie
                          </label>
                          <input
                            type="text"
                            id="category-name"
                            name="category-name"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={editedCategoryName}
                            onChange={(e) => setEditedCategoryName(e.target.value)}
                            placeholder="Ex: Émotions, Travail, Familial..."
                          />
                        </div>
                        <div>
                          <label htmlFor="category-description" className="block text-sm font-medium text-gray-700">
                            Description (optionnel)
                          </label>
                          <textarea
                            id="category-description"
                            name="category-description"
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={editedCategoryDescription}
                            onChange={(e) => setEditedCategoryDescription(e.target.value)}
                            placeholder="Description de la catégorie..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button 
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSaveCategory}
                    disabled={loading || !editedCategoryName.trim()}
                  >
                    {loading ? 'Enregistrement...' : (isAddingCategory ? 'Ajouter' : 'Enregistrer')}
                  </button>
                  <button 
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setShowCategoryModal(false)}
                    disabled={loading}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </MainLayout>
    </ProtectedRoute>
  );
} 