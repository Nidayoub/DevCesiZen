import { useState, useRef, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function ProfileMenu() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setLoggingOut(false);
    }
  };
  
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center space-x-4">
        <Link 
          href="/login"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Connexion
        </Link>
        <Link 
          href="/register"
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          S'inscrire
        </Link>
      </div>
    );
  }
  
  return (
    <Menu as="div" className="relative ml-3">
      <div>
        <Menu.Button className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          <span className="sr-only">Ouvrir le menu utilisateur</span>
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
            {user.firstname?.charAt(0)}{user.lastname?.charAt(0)}
          </div>
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-3">
            <p className="text-sm">Connecté en tant que</p>
            <p className="truncate text-sm font-medium text-gray-900">{user.firstname} {user.lastname}</p>
            <p className="truncate text-sm text-gray-500">{user.email}</p>
          </div>
          
          <hr className="border-t border-gray-200" />
          
          <Menu.Item>
            {({ active }) => (
              <Link
                href="/dashboard"
                className={`block px-4 py-2 text-sm text-gray-700 ${active ? 'bg-gray-100' : ''}`}
              >
                Tableau de bord
              </Link>
            )}
          </Menu.Item>
          
          <Menu.Item>
            {({ active }) => (
              <Link
                href="/profile"
                className={`block px-4 py-2 text-sm text-gray-700 ${active ? 'bg-gray-100' : ''}`}
              >
                Mon profil
              </Link>
            )}
          </Menu.Item>
          
          {user.role === 'admin' || user.role === 'super-admin' ? (
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/admin"
                  className={`block px-4 py-2 text-sm text-gray-700 ${active ? 'bg-gray-100' : ''}`}
                >
                  Administration
                </Link>
              )}
            </Menu.Item>
          ) : null}
          
          <hr className="border-t border-gray-200" />
          
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className={`block w-full text-left px-4 py-2 text-sm text-gray-700 ${active ? 'bg-gray-100' : ''} ${loggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loggingOut ? 'Déconnexion...' : 'Se déconnecter'}
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
} 