'use client';

import { useState } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import MainLayout from '../../components/MainLayout';
import { User } from '../../types/user';

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Simuler le chargement des utilisateurs
  const loadUsers = async () => {
    setLoading(true);
    // Ici, vous feriez un appel API réel
    // const response = await fetch('/api/users');
    // const data = await response.json();
    
    // Pour la démonstration, nous utilisons des données fictives
    setTimeout(() => {
      setUsers([
        {
          id: 1,
          email: 'admin@cesizen.fr',
          firstname: 'Admin',
          lastname: 'CesiZen',
          role: 'admin',
          created_at: '2023-01-01T12:00:00Z',
          updated_at: '2023-01-01T12:00:00Z'
        },
        {
          id: 2,
          email: 'user1@example.com',
          firstname: 'Jean',
          lastname: 'Dupont',
          role: 'user',
          created_at: '2023-01-02T12:00:00Z',
          updated_at: '2023-01-02T12:00:00Z'
        },
        {
          id: 3,
          email: 'user2@example.com',
          firstname: 'Marie',
          lastname: 'Martin',
          role: 'user',
          created_at: '2023-01-03T12:00:00Z',
          updated_at: '2023-01-03T12:00:00Z'
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <MainLayout>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold text-gray-900">Administration</h1>
              <p className="mt-2 text-sm text-gray-700">
                Gestion des utilisateurs et des ressources
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={loadUsers}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
              >
                {loading ? 'Chargement...' : 'Charger les utilisateurs'}
              </button>
            </div>
          </div>
          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Nom
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Email
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Rôle
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Date d'inscription
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Modifier</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                            {loading ? 'Chargement des utilisateurs...' : 'Cliquez sur "Charger les utilisateurs" pour afficher la liste'}
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              {user.firstname} {user.lastname}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.email}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {user.role === 'user' && 'Utilisateur'}
                              {user.role === 'admin' && 'Administrateur'}
                              {user.role === 'super-admin' && 'Super Administrateur'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <button className="text-indigo-600 hover:text-indigo-900 mr-2">
                                Modifier
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                Supprimer
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
      </MainLayout>
    </ProtectedRoute>
  );
} 