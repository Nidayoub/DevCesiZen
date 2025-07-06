'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '../../../../../components/MainLayout';
import AdminMenu from '../../../../../components/AdminMenu';
import { resourcesApi } from '../../../../../services/api.service';
import { ProtectedRoute } from '../../../../../components/ProtectedRoute';

interface Resource {
  id: number;
  title: string;
  description: string;
  type: string;
  url?: string;
}

export default function EditResourcePage() {
  const params = useParams();
  const { id } = params as { id: string };
  const router = useRouter();

  const [resource, setResource] = useState<Resource | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('url');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await resourcesApi.getById(Number(id));
        const data: Resource = res.data;
        setResource(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setType(data.type);
        setUrl(data.url || '');
        setLoading(false);
      } catch (err) {
        console.error('Erreur chargement ressource:', err);
        setError('Impossible de charger la ressource');
        setLoading(false);
      }
    };
    if (id) fetch();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resource) return;
    try {
      setSubmitting(true);
      await resourcesApi.update(resource.id, { title, description, type, url: url || undefined });
      router.push('/admin/resources');
    } catch (err) {
      console.error('Erreur mise à jour:', err);
      setError("Impossible de mettre à jour la ressource");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div></div>;
  if (error) return <div className="text-center text-red-600 mt-10">{error}</div>;

  return (
    <ProtectedRoute requiredRole="admin">
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/4"><AdminMenu /></div>
            <div className="md:w-3/4">
              <div className="bg-white shadow rounded-lg p-6">
                <h1 className="text-xl font-semibold text-gray-900 mb-6">Modifier la ressource</h1>
                {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL / Lien</label>
                    <input type="text" value={url} onChange={e => setUrl(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">Annuler</button>
                    <button type="submit" disabled={submitting} className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300">{submitting ? 'Enregistrement...' : 'Mettre à jour'}</button>
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