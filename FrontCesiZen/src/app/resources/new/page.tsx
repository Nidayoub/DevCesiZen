'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '../../../components/MainLayout';
import { infoResourcesApi, categoriesApi, mediaApi } from '../../../services/api.service';
import { ProtectedRoute } from '../../../components/ProtectedRoute';

export default function CreateResourcePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [readingTime, setReadingTime] = useState('');
  const [level, setLevel] = useState('debutant');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaUpload, setMediaUpload] = useState<{type: 'image' | 'video', url: string, filename: string} | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesApi.getAll();
        setCategories(response.data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
        // Fallback vers les catégories par défaut si l'API échoue
        setCategories([
          { id: 1, name: 'generale' },
          { id: 2, name: 'stress' },
          { id: 3, name: 'sommeil' },
          { id: 4, name: 'alimentation' },
          { id: 5, name: 'exercice' },
          { id: 6, name: 'meditation' },
          { id: 7, name: 'respiration' },
          { id: 8, name: 'productivite' },
          { id: 9, name: 'motivation' },
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMediaUpload(null);
    }
  };

  const handleUploadMedia = async () => {
    if (!selectedFile) return;

    try {
      setUploadingMedia(true);
      const response = await mediaApi.upload(selectedFile);
      setMediaUpload(response.data.media);
      setError('');
    } catch (err) {
      console.error('Erreur upload média:', err);
      setError('Impossible d\'uploader le média');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleRemoveMedia = () => {
    setSelectedFile(null);
    setMediaUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !summary || !content || !category) {
      setError('Le titre, résumé, contenu et catégorie sont obligatoires');
      return;
    }
    try {
      setLoading(true);
      const resourceData = {
        title,
        summary,
        content,
        category,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        reading_time: readingTime || undefined,
        level,
        media_type: mediaUpload?.type || undefined,
        media_url: mediaUpload?.url || undefined,
        media_filename: mediaUpload?.filename || undefined
      };
      await infoResourcesApi.create(resourceData);
      router.push('/resources');
    } catch (err) {
      console.error('Erreur création ressource:', err);
      setError("Impossible de créer la ressource");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Créer une nouvelle ressource</h1>
            <p className="text-gray-600 mb-6">Partagez une ressource utile avec la communauté CesiZen</p>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Donnez un titre à votre ressource"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Résumé *
                </label>
                <textarea
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Résumé court de votre ressource"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenu *
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={8}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Contenu détaillé de votre ressource (vous pouvez utiliser du Markdown)"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie *
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                  disabled={loadingCategories}
                >
                  <option value="">
                    {loadingCategories ? 'Chargement...' : 'Sélectionnez une catégorie'}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temps de lecture (ex: 5 min)
                </label>
                <input
                  type="text"
                  value={readingTime}
                  onChange={e => setReadingTime(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="5 min"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Niveau de difficulté
                </label>
                <select
                  value={level}
                  onChange={e => setLevel(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="debutant">Débutant</option>
                  <option value="intermediaire">Intermédiaire</option>
                  <option value="avance">Avancé</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="relaxation, bien-être, santé mentale"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ajoutez des mots-clés pour aider les autres à trouver votre ressource
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Média (image ou vidéo)
                </label>
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  
                  {selectedFile && !mediaUpload && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">Fichier sélectionné: {selectedFile.name}</span>
                      <button
                        type="button"
                        onClick={handleUploadMedia}
                        disabled={uploadingMedia}
                        className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                      >
                        {uploadingMedia ? 'Upload...' : 'Uploader'}
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveMedia}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                  
                  {mediaUpload && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-green-800">Média uploadé avec succès!</span>
                          <p className="text-xs text-green-600 mt-1">Type: {mediaUpload.type} | Fichier: {mediaUpload.filename}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveMedia}
                          className="text-red-600 hover:text-red-800"
                        >
                          Supprimer
                        </button>
                      </div>
                      {mediaUpload.type === 'image' && (
                        <img src={mediaUpload.url} alt="Prévisualisation" className="mt-2 max-w-xs max-h-32 object-cover rounded" />
                      )}
                      {mediaUpload.type === 'video' && (
                        <video src={mediaUpload.url} controls className="mt-2 max-w-xs max-h-32 rounded" />
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Formats acceptés: JPEG, PNG, GIF, WebP pour les images | MP4, WebM, OGG pour les vidéos (max 10MB)
                </p>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {loading ? 'Création...' : 'Créer la ressource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
} 