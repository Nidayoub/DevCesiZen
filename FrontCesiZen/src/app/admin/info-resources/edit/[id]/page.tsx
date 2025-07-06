'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MainLayout from '../../../../../components/MainLayout';
import AdminMenu from '../../../../../components/AdminMenu';
import { infoResourcesApi } from '../../../../../services/api.service';
import { ProtectedRoute } from '../../../../../components/ProtectedRoute';

interface InfoResource {
  id: number;
  title: string;
  summary: string;
  content: string;
  category?: string;
  publication_date: string;
  tags?: string[];
}

export default function EditInfoResourcePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };

  const [resource, setResource] = useState<InfoResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Champs de formulaire
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    const fetchResource = async () => {
      try {
        const response = await infoResourcesApi.getById(Number(id));
        const data: InfoResource = response.data.resource || response.data;
        setResource(data);
        setTitle(data.title);
        setSummary(data.summary);
        setContent(data.content);
        setCategory(data.category || '');
        setTags(data.tags ? data.tags.join(', ') : '');
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement de la ressource:', err);
        setError('Impossible de charger la ressource');
        setLoading(false);
      }
    };

    if (id) fetchResource();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resource) return;

    try {
      setSubmitting(true);
      await infoResourcesApi.update(resource.id, {
        title,
        summary,
        content,
        category: category || undefined,
        tags: tags
          ? tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined,
      });
      router.push('/admin/info-resources');
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      setError("Impossible de mettre à jour la ressource");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-600 font-medium">
        {error}
      </div>
    );
  }

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
                <h1 className="text-xl font-semibold text-gray-900 mb-6">Modifier la ressource</h1>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Titre
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
                      Résumé
                    </label>
                    <textarea
                      id="summary"
                      rows={3}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    ></textarea>
                  </div>

                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                      Contenu
                    </label>
                    <textarea
                      id="content"
                      rows={10}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    ></textarea>
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Catégorie (optionnel)
                    </label>
                    <input
                      type="text"
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                      Tags (séparés par des virgules)
                    </label>
                    <input
                      type="text"
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="ex: stress, respiration, yoga"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-300"
                    >
                      {submitting ? 'Enregistrement...' : 'Mettre à jour'}
                    </button>
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