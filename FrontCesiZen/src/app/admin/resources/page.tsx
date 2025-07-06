'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MainLayout from '../../../components/MainLayout';
import AdminMenu from '../../../components/AdminMenu';
import { resourcesApi, categoriesApi } from '../../../services/api.service';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { toast } from 'react-hot-toast';

interface Resource {
  id: number;
  title: string;
  description: string;
  type: string;
  url?: string;
  created_at: string;
  updated_at: string;
  category_id?: number;
  category?: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'resources' | 'categories'>('resources');
  
  // États pour les ressources
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // États pour les catégories
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState<string>('');
  const [editedCategoryDescription, setEditedCategoryDescription] = useState<string>('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryDeleteId, setCategoryDeleteId] = useState<number | null>(null);
  const [showCategoryDeleteModal, setShowCategoryDeleteModal] = useState(false);

  // Nouveaux états pour les fonctionnalités avancées
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedResources, setSelectedResources] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await resourcesApi.getAll();
      setResources(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la récupération des ressources:', err);
      setError('Impossible de charger les ressources');
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      setCategories(response.data);
    } catch (err) {
      console.error('Erreur lors de la récupération des catégories:', err);
    }
  };

  // Fonctions de gestion des catégories
  const handleSaveCategory = async () => {
    if (!editedCategoryName.trim()) {
      toast.error('Le nom de la catégorie est requis');
      return;
    }

    try {
      setLoading(true);
      if (isAddingCategory) {
        const response = await categoriesApi.create({
          name: editedCategoryName,
          description: editedCategoryDescription
        });
        setCategories([...categories, response.data]);
        toast.success('Catégorie ajoutée avec succès');
      } else if (categoryToEdit) {
        const response = await categoriesApi.update(categoryToEdit.id, {
          name: editedCategoryName,
          description: editedCategoryDescription
        });
        setCategories(categories.map(c => c.id === categoryToEdit.id ? response.data : c));
        toast.success('Catégorie modifiée avec succès');
      }
      setShowCategoryModal(false);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      toast.error('Erreur lors de la sauvegarde de la catégorie');
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryDeleteId) return;
    try {
      setLoading(true);
      await categoriesApi.delete(categoryDeleteId);
      setCategories(categories.filter(c => c.id !== categoryDeleteId));
      setShowCategoryDeleteModal(false);
      toast.success('Catégorie supprimée avec succès');
      setLoading(false);
    } catch (err) {
      console.error('Erreur suppression:', err);
      toast.error('Erreur lors de la suppression de la catégorie');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchCategories();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await resourcesApi.delete(deleteId);
      setResources(resources.filter(r => r.id !== deleteId));
      setShowDeleteModal(false);
      setIsDeleting(false);
      toast.success('Ressource supprimée avec succès');
    } catch (err) {
      console.error('Erreur suppression:', err);
      toast.error('Erreur lors de la suppression');
      setIsDeleting(false);
    }
  };

  // Nouvelles fonctions pour les fonctionnalités avancées
  const getTypes = () => {
    const types = [...new Set(resources.map(r => r.type))];
    return types.sort();
  };

  const getFilteredAndSortedResources = () => {
    let filtered = resources;

    // Filtrer par recherche
    if (searchTerm) {
      filtered = filtered.filter(resource => 
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrer par type
    if (selectedType) {
      filtered = filtered.filter(resource => resource.type === selectedType);
    }

    // Trier
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Resource];
      let bValue: any = b[sortBy as keyof Resource];

      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  };

  // Fonction pour obtenir les ressources paginées
  const getPaginatedResources = () => {
    const filtered = getFilteredAndSortedResources();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Fonction pour obtenir les informations de pagination
  const getPaginationInfo = () => {
    const filtered = getFilteredAndSortedResources();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filtered.length);
    
    return {
      totalItems: filtered.length,
      totalPages,
      currentPage,
      startIndex: startIndex + 1,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  };

  // Fonction pour changer de page
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedResources([]); // Réinitialiser la sélection
  };

  // Réinitialiser la page lors du changement de filtres
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    const [field, order] = value.split('-');
    setSortBy(field);
    setSortOrder(order as 'asc' | 'desc');
    setCurrentPage(1);
  };

  // Fonction pour tout sélectionner/désélectionner
  const handleSelectAll = () => {
    if (isDeleting) return;
    const paginatedResources = getPaginatedResources();
    if (selectedResources.length === paginatedResources.length) {
      setSelectedResources([]);
    } else {
      setSelectedResources(paginatedResources.map(r => r.id));
    }
  };

  // Fonction pour gérer la sélection d'une ressource
  const handleSelectResource = (resourceId: number) => {
    if (isDeleting) return;
    setSelectedResources(prev => 
      prev.includes(resourceId) 
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  // Fonction pour gérer la suppression en lot
  const handleBulkDelete = async () => {
    if (selectedResources.length === 0 || isDeleting) return;

    const count = selectedResources.length;
    try {
      setIsDeleting(true);
      await Promise.all(selectedResources.map(id => resourcesApi.delete(id)));
      setResources(resources.filter(resource => !selectedResources.includes(resource.id)));
      setSelectedResources([]);
      setShowBulkActions(false);
      setIsDeleting(false);
      toast.success(`${count} ressource(s) supprimée(s) avec succès`);
    } catch (err) {
      console.error('Erreur lors de la suppression en lot:', err);
      setIsDeleting(false);
      toast.error('Erreur lors de la suppression en lot');
    }
  };

  // Fonction pour fermer le modal de suppression
  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  // Fonction pour ouvrir le modal de suppression
  const handleOpenDeleteModal = (resourceId: number) => {
    if (isDeleting || showDeleteModal) return;
    setDeleteId(resourceId);
    setShowDeleteModal(true);
  };

  // Fonction pour gérer les clics sur les boutons d'action
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDeleting) return;
    action();
  };

  // Composant de pagination
  const PaginationComponent = () => {
    const paginationInfo = getPaginationInfo();
    
    if (paginationInfo.totalPages <= 1) return null;

    const generatePageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      let startPage = Math.max(1, paginationInfo.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(paginationInfo.totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      return pages;
    };

    return (
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(paginationInfo.currentPage - 1)}
            disabled={!paginationInfo.hasPrevPage}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <button
            onClick={() => handlePageChange(paginationInfo.currentPage + 1)}
            disabled={!paginationInfo.hasNextPage}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Affichage de <span className="font-medium">{paginationInfo.startIndex}</span> à{' '}
              <span className="font-medium">{paginationInfo.endIndex}</span> sur{' '}
              <span className="font-medium">{paginationInfo.totalItems}</span> résultats
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(paginationInfo.currentPage - 1)}
                disabled={!paginationInfo.hasPrevPage}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Précédent</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              {generatePageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    page === paginationInfo.currentPage
                      ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(paginationInfo.currentPage + 1)}
                disabled={!paginationInfo.hasNextPage}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Suivant</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  const getResourceStats = () => {
    const total = resources.length;
    const byType = resources.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, byType };
  };

  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Gestion des ressources</h1>
                    <p className="mt-2 text-sm text-gray-700">Gérez les ressources générales et leurs catégories.</p>
                  </div>
                  <div className="flex space-x-2">
                    {activeTab === 'resources' && (
                      <Link href="/admin/resources/create" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Créer une ressource
                      </Link>
                    )}
                    {activeTab === 'categories' && (
                      <button
                        onClick={() => {
                          setIsAddingCategory(true);
                          setCategoryToEdit(null);
                          setEditedCategoryName('');
                          setEditedCategoryDescription('');
                          setShowCategoryModal(true);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Ajouter une catégorie
                      </button>
                    )}
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
                      Ressources
                    </button>
                    <button
                      onClick={() => setActiveTab('categories')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'categories'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Catégories
                    </button>
                  </nav>
                </div>

                {/* Contenu des onglets */}
                {activeTab === 'resources' ? (
                  <>
                    {/* Statistiques */}
                    {!loading && !error && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="text-blue-600 text-2xl">📚</div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-blue-600">Total Ressources</p>
                              <p className="text-lg font-semibold text-blue-900">{getResourceStats().total}</p>
                            </div>
                          </div>
                        </div>
                        {Object.entries(getResourceStats().byType).slice(0, 3).map(([type, count]) => (
                          <div key={type} className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="text-green-600 text-2xl">
                                  {type === 'video' ? '🎥' : type === 'audio' ? '🎵' : type === 'pdf' ? '📄' : type === 'link' ? '🔗' : '📋'}
                                </div>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-green-600">{type}</p>
                                <p className="text-lg font-semibold text-green-900">{count}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Barre de recherche et filtres */}
                    {!loading && !error && (
                      <div className="mb-6 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Rechercher par titre ou description..."
                              value={searchTerm}
                              onChange={(e) => handleSearchChange(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div className="flex gap-2">
                            <select
                              value={selectedType}
                              onChange={(e) => handleTypeChange(e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="">Tous les types</option>
                              {getTypes().map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                            <select
                              value={`${sortBy}-${sortOrder}`}
                              onChange={(e) => handleSortChange(e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="created_at-desc">Plus récent</option>
                              <option value="created_at-asc">Plus ancien</option>
                              <option value="title-asc">Titre A-Z</option>
                              <option value="title-desc">Titre Z-A</option>
                              <option value="type-asc">Type A-Z</option>
                              <option value="updated_at-desc">Dernière modification</option>
                            </select>
                          </div>
                        </div>

                        {/* Actions en lot */}
                        {selectedResources.length > 0 && (
                          <div className="bg-indigo-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-indigo-700">
                                  {selectedResources.length} ressource(s) sélectionnée(s)
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setSelectedResources([])}
                                  className="text-sm text-indigo-600 hover:text-indigo-700"
                                >
                                  Désélectionner tout
                                </button>
                                <button
                                  onClick={handleBulkDelete}
                                  disabled={isDeleting}
                                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
                                >
                                  {isDeleting ? 'Suppression...' : 'Supprimer la sélection'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
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
                    <p className="text-gray-500">Aucune ressource disponible</p>
                        <p className="mt-2 text-sm text-gray-500">Commencez par créer votre première ressource</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="w-12 px-3 py-3 text-left">
                                <input
                                  type="checkbox"
                                  checked={selectedResources.length === getPaginatedResources().length && getPaginatedResources().length > 0}
                                  onChange={handleSelectAll}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                              </th>
                              <th scope="col" className="w-2/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Titre
                              </th>
                              <th scope="col" className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th scope="col" className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date Création
                              </th>
                              <th scope="col" className="w-40 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {getPaginatedResources().map((resource) => (
                              <tr key={resource.id} className={`hover:bg-gray-50 ${selectedResources.includes(resource.id) ? 'bg-indigo-50' : ''}`}>
                                <td className="w-12 px-3 py-4 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={selectedResources.includes(resource.id)}
                                    onChange={() => handleSelectResource(resource.id)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  />
                                </td>
                                <td className="w-2/5 px-4 py-4">
                                  <div className="max-w-xs">
                                    <div className="text-sm font-medium text-gray-900 break-words" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{resource.title}</div>
                                    <div className="text-sm text-gray-500 break-words mt-1" style={{display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{resource.description}</div>
                                  </div>
                                </td>
                                <td className="w-32 px-4 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                    resource.type === 'video' ? 'bg-red-100 text-red-800' :
                                    resource.type === 'audio' ? 'bg-green-100 text-green-800' :
                                    resource.type === 'pdf' ? 'bg-blue-100 text-blue-800' :
                                    resource.type === 'link' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {resource.type}
                                  </span>
                                </td>
                                <td className="w-32 px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <div className="text-sm">{formatDate(resource.created_at)}</div>
                                </td>
                                <td className="w-40 px-4 py-4 whitespace-nowrap">
                                  <div className="flex flex-col space-y-1">
                                    <Link
                                      href={`/admin/resources/edit/${resource.id}`}
                                      className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      ✏️ Modifier
                                    </Link>
                                    <button
                                      onClick={(e) => handleActionClick(e, () => handleOpenDeleteModal(resource.id))}
                                      className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
                                      type="button"
                                    >
                                      🗑️ Supprimer
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        
                        {/* Message si aucun résultat */}
                        {getPaginatedResources().length === 0 && (
                          <div className="text-center py-12">
                            <div className="text-gray-500">
                              <div className="text-4xl mb-2">🔍</div>
                              <p className="text-lg font-medium">Aucun résultat trouvé</p>
                              <p className="text-sm">Essayez de modifier vos critères de recherche</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  /* Onglet Catégories */
                  <>
                    {loading ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                      </div>
                    ) : error ? (
                      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
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
                    ) : categories.length === 0 ? (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
                        <p className="text-gray-500">Aucune catégorie disponible</p>
                        <p className="mt-2 text-sm text-gray-500">Commencez par créer votre première catégorie</p>
                  </div>
                ) : (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nom
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                            {categories.map((category) => (
                              <tr key={category.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{category.description || 'Aucune description'}</div>
                                </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex items-center space-x-3">
                                    <button
                                      onClick={() => {
                                        setIsAddingCategory(false);
                                        setCategoryToEdit(category);
                                        setEditedCategoryName(category.name);
                                        setEditedCategoryDescription(category.description || '');
                                        setShowCategoryModal(true);
                                      }}
                                      className="text-indigo-600 hover:text-indigo-900"
                                    >
                                      Modifier
                                    </button>
                                    <button
                                      onClick={() => {
                                        setCategoryDeleteId(category.id);
                                        setShowCategoryDeleteModal(true);
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
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de suppression des ressources */}
        {showDeleteModal && (
          <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="delete-modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                aria-hidden="true"
                onClick={handleCloseDeleteModal}
              ></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div 
                className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="delete-modal-title">Confirmer la suppression</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Êtes-vous sûr de vouloir supprimer cette ressource ? Cette action est irréversible.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={(e) => handleActionClick(e, handleDelete)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Suppression...' : 'Supprimer'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleCloseDeleteModal}
                    disabled={isDeleting}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'édition des catégories */}
        {showCategoryModal && (
          <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="category-modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowCategoryModal(false)}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" onClick={(e) => e.stopPropagation()}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="category-modal-title">
                    {isAddingCategory ? 'Ajouter une catégorie' : 'Modifier la catégorie'}
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="category-name" className="block text-sm font-medium text-gray-700">Nom *</label>
                      <input
                        type="text"
                        id="category-name"
                        value={editedCategoryName}
                        onChange={(e) => setEditedCategoryName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Nom de la catégorie"
                      />
                    </div>
                    <div>
                      <label htmlFor="category-description" className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        id="category-description"
                        value={editedCategoryDescription}
                        onChange={(e) => setEditedCategoryDescription(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Description de la catégorie"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    onClick={handleSaveCategory}
                    disabled={loading}
                  >
                    {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowCategoryModal(false)}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de suppression des catégories */}
        {showCategoryDeleteModal && (
          <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="category-delete-modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowCategoryDeleteModal(false)}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" onClick={(e) => e.stopPropagation()}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="category-delete-modal-title">Confirmer la suppression</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    onClick={handleDeleteCategory}
                    disabled={loading}
                  >
                    {loading ? 'Suppression...' : 'Supprimer'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowCategoryDeleteModal(false)}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && getPaginationInfo().totalPages > 1 && (
          <PaginationComponent />
        )}
      </MainLayout>
    </ProtectedRoute>
  );
} 