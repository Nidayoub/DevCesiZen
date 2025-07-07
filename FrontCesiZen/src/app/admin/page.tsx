'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import MainLayout from '../../components/MainLayout';
import AdminMenu from '../../components/AdminMenu';
import { User } from '../../types/user';
import { usersApi } from '../../services/api.service';
import { toast } from 'react-hot-toast';

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editedRole, setEditedRole] = useState<string>('');

  // Charger les utilisateurs depuis la base de données
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await usersApi.getAll();
      setUsers(response.data.users || response.data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      setError('Impossible de charger les utilisateurs. Veuillez réessayer.');
      setLoading(false);
    }
  };

  // Charger automatiquement les utilisateurs au chargement de la page
  useEffect(() => {
    loadUsers();
  }, []);

  // Supprimer un utilisateur
  const handleDeleteUser = async () => {
    if (!userToDelete || loading) return;
    
    try {
      setLoading(true);
      
      await usersApi.delete(userToDelete.id);
      setUsers(users.filter(user => user.id !== userToDelete.id));
      toast.success(`L'utilisateur ${userToDelete.firstname} ${userToDelete.lastname} a été supprimé`);
      setShowDeleteModal(false);
      setUserToDelete(null);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      toast.error('Impossible de supprimer l\'utilisateur');
      setShowDeleteModal(false);
      setUserToDelete(null);
      setLoading(false);
    }
  };

  // Modifier le rôle d'un utilisateur
  const handleUpdateUserRole = async () => {
    if (!userToEdit || !editedRole || loading) return;
    
    try {
      setLoading(true);
      
      await usersApi.changeRole(userToEdit.id, editedRole);
      setUsers(users.map(user => 
        user.id === userToEdit.id 
          ? { ...user, role: editedRole as 'user' | 'admin' | 'super-admin' } 
          : user
      ));
      toast.success(`Le rôle de ${userToEdit.firstname} ${userToEdit.lastname} a été modifié avec succès`);
      setShowEditModal(false);
      setUserToEdit(null);
      setEditedRole('');
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la modification du rôle:', err);
      toast.error('Impossible de modifier le rôle de l\'utilisateur');
      setShowEditModal(false);
      setUserToEdit(null);
      setEditedRole('');
      setLoading(false);
    }
  };

  // Ouvrir le modal de suppression
  const openDeleteModal = (user: User) => {
    if (loading) return; // Empêcher l'ouverture pendant les actions
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Ouvrir le modal d'édition
  const openEditModal = (user: User) => {
    if (loading) return; // Empêcher l'ouverture pendant les actions
    setUserToEdit(user);
    setEditedRole(user.role);
    setShowEditModal(true);
  };

  // Fermer le modal de suppression
  const closeDeleteModal = () => {
    if (loading) return; // Empêcher la fermeture pendant les actions
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  // Fermer le modal d'édition
  const closeEditModal = () => {
    if (loading) return; // Empêcher la fermeture pendant les actions
    setShowEditModal(false);
    setUserToEdit(null);
    setEditedRole('');
  };

  // Fonction pour gérer les clics d'action
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return; // Empêcher les actions multiples
    action();
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
                    <h1 className="text-xl font-semibold text-gray-900">Gestion des utilisateurs</h1>
                    <p className="mt-2 text-sm text-gray-700">
                      Liste de tous les utilisateurs de la plateforme
                      {loading && <span className="ml-2 text-indigo-600">⏳ Action en cours...</span>}
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <button
                      type="button"
                      onClick={loadUsers}
                      disabled={loading}
                      className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? '⏳ Chargement...' : '🔄 Rafraîchir la liste'}
                    </button>
                  </div>
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
                
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                      <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          ID
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Nom
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Email
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Rôle
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Date d&#39;inscription
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                            <div className="flex justify-center items-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                              <span className="ml-2">Chargement des utilisateurs...</span>
                            </div>
                          </td>
                        </tr>
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                            Aucun utilisateur trouvé
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              #{user.id}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                              {user.firstname} {user.lastname}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.email}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {user.role === 'user' && (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  Utilisateur
                                </span>
                              )}
                              {user.role === 'admin' && (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                  Administrateur
                                </span>
                              )}
                              {user.role === 'super-admin' && (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                  Super Admin
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {new Date(user.created_at!).toLocaleDateString()}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <button 
                                type="button"
                                onClick={(e) => handleActionClick(e, () => openEditModal(user))}
                                className={`mr-2 ${loading ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-900'}`}
                                disabled={loading}
                              >
                                ✏️ Modifier
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => handleActionClick(e, () => openDeleteModal(user))}
                                className={`${user.role === 'super-admin' || loading ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}`}
                                disabled={user.role === 'super-admin' || loading} // Empêcher la suppression du super-admin et pendant les actions
                              >
                                🗑️ Supprimer
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modal de suppression */}
        {showDeleteModal && (
          <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="delete-modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                aria-hidden="true"
                onClick={closeDeleteModal}
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
                          Êtes-vous sûr de vouloir supprimer l&#39;utilisateur {userToDelete?.firstname} {userToDelete?.lastname} ? Cette action est irréversible.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button 
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={(e) => handleActionClick(e, handleDeleteUser)}
                    disabled={loading}
                  >
                    {loading ? 'Suppression...' : 'Supprimer'}
                  </button>
                  <button 
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={closeDeleteModal}
                    disabled={loading}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal d'édition */}
        {showEditModal && (
          <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="edit-modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Overlay */}
              <div 
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                aria-hidden="true"
                onClick={closeEditModal}
              ></div>

              {/* This element is to trick the browser into centering the modal contents. */}
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              {/* Modal panel */}
              <div 
                className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="edit-modal-title">
                        Modifier l&#39;utilisateur
                      </h3>
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-4">
                          <strong>ID:</strong> #{userToEdit?.id} - <strong>Utilisateur:</strong> {userToEdit?.firstname} {userToEdit?.lastname}
                        </p>
                        <div>
                          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                            Rôle
                          </label>
                          <select
                            id="role"
                            name="role"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            value={editedRole}
                            onChange={(e) => setEditedRole(e.target.value)}
                            disabled={userToEdit?.role === 'super-admin' || loading} // Ne pas permettre de modifier le role super-admin ou pendant les actions
                          >
                            <option value="user">Utilisateur</option>
                            <option value="admin">Administrateur</option>
                            {userToEdit?.role === 'super-admin' && (
                              <option value="super-admin">Super Administrateur</option>
                            )}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button 
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={(e) => handleActionClick(e, handleUpdateUserRole)}
                    disabled={loading || userToEdit?.role === 'super-admin'}
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button 
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={closeEditModal}
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