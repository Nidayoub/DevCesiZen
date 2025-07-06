'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import MainLayout from '../../../components/MainLayout';
import AdminMenu from '../../../components/AdminMenu';
import { categoriesApi, diagnosticCategoriesApi } from '../../../services/api.service';
import { toast } from 'react-hot-toast';

interface ResourceCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

interface DiagnosticCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
  question_count?: number;
}

export default function AdminCategoriesPage() {
  const [activeTab, setActiveTab] = useState<'resources' | 'diagnostic'>('resources');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les catégories de ressources
  const [resourceCategories, setResourceCategories] = useState<ResourceCategory[]>([]);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [editingResourceCategory, setEditingResourceCategory] = useState<ResourceCategory | null>(null);
  const [resourceForm, setResourceForm] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#6B7280'
  });
  
  // États pour les catégories de diagnostic
  const [diagnosticCategories, setDiagnosticCategories] = useState<DiagnosticCategory[]>([]);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [editingDiagnosticCategory, setEditingDiagnosticCategory] = useState<DiagnosticCategory | null>(null);
  const [diagnosticForm, setDiagnosticForm] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#6B7280'
  });

  const defaultColors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
    '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#6B7280'
  ];

  const emojiIcons = [
    '📚', '🎯', '💡', '🔍', '📊', '🎨', '🏃‍♂️', '🧘‍♀️', '💪', '🌟',
    '😰', '😔', '😤', '😴', '👥', '🔥', '🍽️', '🚫', '❓', '💼'
  ];

  // Charger les catégories de ressources
  const loadResourceCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoriesApi.getAll();
      setResourceCategories(response.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des catégories de ressources:', err);
      setError('Impossible de charger les catégories de ressources');
    } finally {
      setLoading(false);
    }
  };

  // Charger les catégories de diagnostic
  const loadDiagnosticCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await diagnosticCategoriesApi.getAllWithCount();
      setDiagnosticCategories(response.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des catégories de diagnostic:', err);
      setError('Impossible de charger les catégories de diagnostic');
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage
  useEffect(() => {
    loadResourceCategories();
    loadDiagnosticCategories();
  }, []);

  // Gestion des catégories de ressources
  const handleResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceForm.name.trim()) {
      toast.error('Le nom de la catégorie est requis');
      return;
    }

    try {
      setLoading(true);
      
      if (editingResourceCategory) {
        await categoriesApi.update(editingResourceCategory.id, resourceForm);
        toast.success('Catégorie de ressource modifiée avec succès');
      } else {
        await categoriesApi.create(resourceForm);
        toast.success('Catégorie de ressource créée avec succès');
      }
      
      setShowResourceModal(false);
      setEditingResourceCategory(null);
      setResourceForm({ name: '', description: '', icon: '', color: '#6B7280' });
      await loadResourceCategories();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      toast.error('Erreur lors de la sauvegarde de la catégorie');
    } finally {
      setLoading(false);
    }
  };

  const handleResourceDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie de ressource ?')) {
      return;
    }

    try {
      setLoading(true);
      await categoriesApi.delete(id);
      toast.success('Catégorie de ressource supprimée avec succès');
      await loadResourceCategories();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      toast.error('Erreur lors de la suppression de la catégorie');
    } finally {
      setLoading(false);
    }
  };

  // Gestion des catégories de diagnostic
  const handleDiagnosticSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosticForm.name.trim()) {
      toast.error('Le nom de la catégorie est requis');
      return;
    }

    try {
      setLoading(true);
      
      if (editingDiagnosticCategory) {
        await diagnosticCategoriesApi.update(editingDiagnosticCategory.id, diagnosticForm);
        toast.success('Catégorie de diagnostic modifiée avec succès');
      } else {
        await diagnosticCategoriesApi.create(diagnosticForm);
        toast.success('Catégorie de diagnostic créée avec succès');
      }
      
      setShowDiagnosticModal(false);
      setEditingDiagnosticCategory(null);
      setDiagnosticForm({ name: '', description: '', icon: '', color: '#6B7280' });
      await loadDiagnosticCategories();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      toast.error('Erreur lors de la sauvegarde de la catégorie');
    } finally {
      setLoading(false);
    }
  };

  const handleDiagnosticDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie de diagnostic ?')) {
      return;
    }

    try {
      setLoading(true);
      await diagnosticCategoriesApi.delete(id);
      toast.success('Catégorie de diagnostic supprimée avec succès');
      await loadDiagnosticCategories();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      toast.error('Erreur lors de la suppression de la catégorie');
    } finally {
      setLoading(false);
    }
  };

  // Fonctions d'ouverture des modals
  const openResourceModal = (category?: ResourceCategory) => {
    if (category) {
      setEditingResourceCategory(category);
      setResourceForm({
        name: category.name,
        description: category.description || '',
        icon: category.icon || '',
        color: category.color || '#6B7280'
      });
    } else {
      setEditingResourceCategory(null);
      setResourceForm({ name: '', description: '', icon: '', color: '#6B7280' });
    }
    setShowResourceModal(true);
  };

  const openDiagnosticModal = (category?: DiagnosticCategory) => {
    if (category) {
      setEditingDiagnosticCategory(category);
      setDiagnosticForm({
        name: category.name,
        description: category.description || '',
        icon: category.icon || '',
        color: category.color || '#6B7280'
      });
    } else {
      setEditingDiagnosticCategory(null);
      setDiagnosticForm({ name: '', description: '', icon: '', color: '#6B7280' });
    }
    setShowDiagnosticModal(true);
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <MainLayout>
        <div className="min-h-screen bg-gray-50">
          <AdminMenu />
          
          <div className="py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">🏷️ Gestion des catégories</h1>
                      <p className="mt-1 text-sm text-gray-600">
                        Gérez les catégories pour les ressources et les questions de diagnostic
                      </p>
                    </div>
                  </div>

                  {/* Onglets */}
                  <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => setActiveTab('resources')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'resources'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        📚 Catégories de ressources
                        <span className="ml-2 bg-gray-100 text-gray-900 text-xs rounded-full px-2 py-1">
                          {resourceCategories.length}
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveTab('diagnostic')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'diagnostic'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        🧠 Catégories de diagnostic
                        <span className="ml-2 bg-gray-100 text-gray-900 text-xs rounded-full px-2 py-1">
                          {diagnosticCategories.length}
                        </span>
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
                  {activeTab === 'resources' ? (
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-medium text-gray-900">Catégories de ressources</h2>
                        <button
                          onClick={() => openResourceModal()}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          ✨ Ajouter une catégorie
                        </button>
                      </div>

                      {loading && resourceCategories.length === 0 ? (
                        <div className="flex justify-center items-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                          <span className="ml-2">Chargement...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {resourceCategories.map((category) => (
                            <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <span className="text-2xl mr-2" style={{ color: category.color }}>
                                    {category.icon || '📚'}
                                  </span>
                                  <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => openResourceModal(category)}
                                    className="text-indigo-600 hover:text-indigo-900 text-sm"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleResourceDelete(category.id)}
                                    className="text-red-600 hover:text-red-900 text-sm"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                              {category.description && (
                                <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                              )}
                              <div className="flex items-center text-xs text-gray-500">
                                <div
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: category.color }}
                                ></div>
                                {category.color}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-medium text-gray-900">Catégories de diagnostic</h2>
                        <button
                          onClick={() => openDiagnosticModal()}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          ✨ Ajouter une catégorie
                        </button>
                      </div>

                      {loading && diagnosticCategories.length === 0 ? (
                        <div className="flex justify-center items-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                          <span className="ml-2">Chargement...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {diagnosticCategories.map((category) => (
                            <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <span className="text-2xl mr-2">
                                    {category.icon || '🧠'}
                                  </span>
                                  <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => openDiagnosticModal(category)}
                                    className="text-indigo-600 hover:text-indigo-900 text-sm"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDiagnosticDelete(category.id)}
                                    className="text-red-600 hover:text-red-900 text-sm"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                              {category.description && (
                                <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                              )}
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center">
                                  <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: category.color }}
                                  ></div>
                                  {category.color}
                                </div>
                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                  {category.question_count || 0} questions
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal pour catégories de ressources */}
        {showResourceModal && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowResourceModal(false)}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
              <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleResourceSubmit}>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                        <span className="text-2xl">📚</span>
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          {editingResourceCategory ? 'Modifier' : 'Ajouter'} une catégorie de ressource
                        </h3>
                        <div className="mt-6 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              📝 Nom de la catégorie *
                            </label>
                            <input
                              type="text"
                              required
                              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              value={resourceForm.name}
                              onChange={(e) => setResourceForm({...resourceForm, name: e.target.value})}
                              placeholder="Nom de la catégorie"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              📄 Description
                            </label>
                            <textarea
                              rows={3}
                              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              value={resourceForm.description}
                              onChange={(e) => setResourceForm({...resourceForm, description: e.target.value})}
                              placeholder="Description de la catégorie"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              🎯 Icône
                            </label>
                            <div className="grid grid-cols-10 gap-2 mb-2">
                              {emojiIcons.map((emoji, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => setResourceForm({...resourceForm, icon: emoji})}
                                  className={`p-2 rounded border ${resourceForm.icon === emoji ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                            <input
                              type="text"
                              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              value={resourceForm.icon}
                              onChange={(e) => setResourceForm({...resourceForm, icon: e.target.value})}
                              placeholder="Ou tapez votre propre emoji"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              🎨 Couleur
                            </label>
                            <div className="grid grid-cols-9 gap-2 mb-2">
                              {defaultColors.map((color, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => setResourceForm({...resourceForm, color})}
                                  className={`w-8 h-8 rounded border-2 ${resourceForm.color === color ? 'border-gray-800' : 'border-gray-300'}`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <input
                              type="color"
                              className="block w-full h-10 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              value={resourceForm.color}
                              onChange={(e) => setResourceForm({...resourceForm, color: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {loading ? 'Sauvegarde...' : (editingResourceCategory ? 'Modifier' : 'Ajouter')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResourceModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal pour catégories de diagnostic */}
        {showDiagnosticModal && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDiagnosticModal(false)}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
              <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleDiagnosticSubmit}>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                        <span className="text-2xl">🧠</span>
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          {editingDiagnosticCategory ? 'Modifier' : 'Ajouter'} une catégorie de diagnostic
                        </h3>
                        <div className="mt-6 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              📝 Nom de la catégorie *
                            </label>
                            <input
                              type="text"
                              required
                              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                              value={diagnosticForm.name}
                              onChange={(e) => setDiagnosticForm({...diagnosticForm, name: e.target.value})}
                              placeholder="Nom de la catégorie"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              📄 Description
                            </label>
                            <textarea
                              rows={3}
                              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                              value={diagnosticForm.description}
                              onChange={(e) => setDiagnosticForm({...diagnosticForm, description: e.target.value})}
                              placeholder="Description de la catégorie"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              🎯 Icône
                            </label>
                            <div className="grid grid-cols-10 gap-2 mb-2">
                              {emojiIcons.map((emoji, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => setDiagnosticForm({...diagnosticForm, icon: emoji})}
                                  className={`p-2 rounded border ${diagnosticForm.icon === emoji ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                            <input
                              type="text"
                              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                              value={diagnosticForm.icon}
                              onChange={(e) => setDiagnosticForm({...diagnosticForm, icon: e.target.value})}
                              placeholder="Ou tapez votre propre emoji"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              🎨 Couleur
                            </label>
                            <div className="grid grid-cols-9 gap-2 mb-2">
                              {defaultColors.map((color, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => setDiagnosticForm({...diagnosticForm, color})}
                                  className={`w-8 h-8 rounded border-2 ${diagnosticForm.color === color ? 'border-gray-800' : 'border-gray-300'}`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <input
                              type="color"
                              className="block w-full h-10 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                              value={diagnosticForm.color}
                              onChange={(e) => setDiagnosticForm({...diagnosticForm, color: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {loading ? 'Sauvegarde...' : (editingDiagnosticCategory ? 'Modifier' : 'Ajouter')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDiagnosticModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </MainLayout>
    </ProtectedRoute>
  );
} 