'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '../../../../components/MainLayout';
import AdminMenu from '../../../../components/AdminMenu';
import { resourcesApi, categoriesApi } from '../../../../services/api.service';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';

interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export default function CreateResourcePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [type, setType] = useState('url');
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Charger les catégories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoriesApi.getAll();
        setCategories(response.data || []);
      } catch (err) {
        console.error('Erreur lors du chargement des catégories:', err);
      }
    };
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !type) {
      setError('Le titre et le type sont obligatoires');
      return;
    }
    try {
      setLoading(true);
      await resourcesApi.create({ 
        title, 
        description: description || undefined, 
        content: content || undefined,
        image_url: imageUrl || undefined,
        type, 
        url: url || undefined,
        category_id: categoryId || undefined
      });
      router.push('/admin/resources');
    } catch (err) {
      console.error('Erreur création ressource:', err);
      setError("Impossible de créer la ressource");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/4"><AdminMenu /></div>
            <div className="md:w-3/4">
              <div className="bg-white shadow rounded-lg p-6">
                <h1 className="text-xl font-semibold text-gray-900 mb-6">Créer une ressource</h1>
                {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
                    <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Contenu détaillé (optionnel)" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="https://example.com/image.jpg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select value={type} onChange={e => setType(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required>
                      <option value="url">URL</option>
                      <option value="video">Vidéo</option>
                      <option value="pdf">PDF</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">📂 Catégorie</label>
                    <select 
                      value={categoryId || ''} 
                      onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : undefined)} 
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="">Aucune catégorie</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL / Lien</label>
                    <input type="url" value={url} onChange={e => setUrl(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="https://example.com/resource" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">Annuler</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300">{loading ? 'Enregistrement...' : 'Créer'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
} 