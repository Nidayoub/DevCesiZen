'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '../../../../components/MainLayout';
import AdminMenu from '../../../../components/AdminMenu';
import { infoResourcesApi, mediaApi } from '../../../../services/api.service';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';

export default function CreateInfoResourcePage() {
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
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaUpload, setMediaUpload] = useState<{type: string, url: string, filename: string} | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const categories = [
    { value: 'gestion-stress', label: 'Gestion du stress', icon: '🧘' },
    { value: 'respiration', label: 'Respiration', icon: '💨' },
    { value: 'meditation', label: 'Méditation', icon: '🧘‍♀️' },
    { value: 'sommeil', label: 'Sommeil', icon: '😴' },
    { value: 'nutrition', label: 'Nutrition', icon: '🥗' },
    { value: 'exercice', label: 'Exercice', icon: '🏃' },
    { value: 'mindfulness', label: 'Pleine conscience', icon: '🌸' },
    { value: 'relation', label: 'Relations', icon: '👫' },
    { value: 'travail', label: 'Bien-être au travail', icon: '💼' },
    { value: 'autres', label: 'Autres', icon: '📚' }
  ];

  const levels = [
    { value: 'debutant', label: 'Débutant', icon: '🌱', description: 'Accessible à tous' },
    { value: 'intermediaire', label: 'Intermédiaire', icon: '🌿', description: 'Quelques connaissances requises' },
    { value: 'avance', label: 'Avancé', icon: '🌳', description: 'Expertise recommandée' }
  ];

  const validateField = (field: string, value: string) => {
    const errors = {...fieldErrors};
    
    switch (field) {
      case 'title':
        if (!value.trim()) {
          errors.title = 'Le titre est obligatoire';
        } else if (value.length < 5) {
          errors.title = 'Le titre doit contenir au moins 5 caractères';
        } else if (value.length > 100) {
          errors.title = 'Le titre ne peut pas dépasser 100 caractères';
        } else {
          delete errors.title;
        }
        break;
      case 'summary':
        if (!value.trim()) {
          errors.summary = 'Le résumé est obligatoire';
        } else if (value.length < 20) {
          errors.summary = 'Le résumé doit contenir au moins 20 caractères';
        } else if (value.length > 300) {
          errors.summary = 'Le résumé ne peut pas dépasser 300 caractères';
        } else {
          delete errors.summary;
        }
        break;
      case 'content':
        if (!value.trim()) {
          errors.content = 'Le contenu est obligatoire';
        } else if (value.length < 100) {
          errors.content = 'Le contenu doit contenir au moins 100 caractères';
        } else {
          delete errors.content;
        }
        break;
      case 'readingTime':
        if (value && !/^\d+\s?(min|minutes?)$/i.test(value)) {
          errors.readingTime = 'Format attendu: "5 min" ou "10 minutes"';
        } else {
          delete errors.readingTime;
        }
        break;
    }
    
    setFieldErrors(errors);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg'];
      if (!allowedTypes.includes(file.type)) {
        setError('Type de fichier non supporté. Formats acceptés : JPEG, PNG, GIF, WebP, MP4, WebM, OGG');
        return;
      }
      
      // Vérifier la taille (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('Le fichier est trop volumineux. Taille maximale : 10MB');
        return;
      }
      
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUploadMedia = async () => {
    if (!selectedFile) return;

    try {
      setUploadingMedia(true);
      setError('');
      
      const response = await mediaApi.upload(selectedFile);
      setMediaUpload(response.data.media);
      
      // Nettoyer l'input file après upload réussi
      const fileInput = document.getElementById('media-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Erreur upload média:', error);
      setError('Impossible d\'uploader le média. Vérifiez votre connexion.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleRemoveMedia = () => {
    setSelectedFile(null);
    setMediaUpload(null);
    const fileInput = document.getElementById('media-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation complète
    validateField('title', title);
    validateField('summary', summary);
    validateField('content', content);
    validateField('readingTime', readingTime);

    if (Object.keys(fieldErrors).length > 0) {
      setError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    const payload: any = {
      title,
      summary,
      content,
      category: category || undefined,
      reading_time: readingTime || undefined,
      level,
      publication_date: new Date().toISOString(),
      tags: tags
        ? tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined,
      media_type: mediaUpload?.type || null,
      media_url: mediaUpload?.url || null,
      media_filename: mediaUpload?.filename || null,
    };

    try {
      setLoading(true);
      setError('');
      await infoResourcesApi.create(payload);
      router.push('/admin/info-resources');
    } catch (err) {
      console.error('Erreur lors de la création de la ressource:', err);
      setError("Impossible de créer la ressource. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const getCharacterCount = (text: string, max: number) => {
    const count = text.length;
    const percentage = (count / max) * 100;
    const colorClass = percentage > 90 ? 'text-red-500' : percentage > 70 ? 'text-yellow-500' : 'text-gray-500';
    return (
      <span className={`text-xs ${colorClass}`}>
        {count}/{max}
      </span>
    );
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
              <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8">
                  <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <span className="text-3xl">📝</span>
                    Créer une nouvelle ressource
                  </h1>
                  <p className="text-indigo-100 mt-2">
                    Partagez une ressource utile avec la communauté CesiZen
                  </p>
                </div>

                <div className="p-8">
                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
                      <div className="flex items-center">
                        <span className="text-red-500 mr-2">⚠️</span>
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Titre */}
                    <div className="space-y-2">
                      <label htmlFor="title" className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <span className="text-lg">✏️</span>
                        Titre *
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          validateField('title', e.target.value);
                        }}
                        className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                          fieldErrors.title 
                            ? 'border-red-300 bg-red-50 focus:border-red-500' 
                            : 'border-gray-200 focus:border-indigo-500 focus:bg-white'
                        } focus:ring-2 focus:ring-indigo-200 shadow-sm`}
                        placeholder="Un titre accrocheur pour votre ressource..."
                        required
                      />
                      <div className="flex justify-between items-center">
                        {fieldErrors.title && (
                          <span className="text-red-500 text-xs flex items-center gap-1">
                            <span>⚠️</span>
                            {fieldErrors.title}
                          </span>
                        )}
                        <div className="ml-auto">
                          {getCharacterCount(title, 100)}
                        </div>
                      </div>
                    </div>

                    {/* Résumé */}
                    <div className="space-y-2">
                      <label htmlFor="summary" className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <span className="text-lg">📄</span>
                        Résumé *
                      </label>
                      <textarea
                        id="summary"
                        rows={4}
                        value={summary}
                        onChange={(e) => {
                          setSummary(e.target.value);
                          validateField('summary', e.target.value);
                        }}
                        className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 resize-none ${
                          fieldErrors.summary 
                            ? 'border-red-300 bg-red-50 focus:border-red-500' 
                            : 'border-gray-200 focus:border-indigo-500 focus:bg-white'
                        } focus:ring-2 focus:ring-indigo-200 shadow-sm`}
                        placeholder="Décrivez brièvement le contenu et les bénéfices de votre ressource..."
                        required
                      />
                      <div className="flex justify-between items-center">
                        {fieldErrors.summary && (
                          <span className="text-red-500 text-xs flex items-center gap-1">
                            <span>⚠️</span>
                            {fieldErrors.summary}
                          </span>
                        )}
                        <div className="ml-auto">
                          {getCharacterCount(summary, 300)}
                        </div>
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="space-y-2">
                      <label htmlFor="content" className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <span className="text-lg">📖</span>
                        Contenu *
                        <span className="text-xs text-gray-500 font-normal">(Markdown supporté)</span>
                      </label>
                      <textarea
                        id="content"
                        rows={12}
                        value={content}
                        onChange={(e) => {
                          setContent(e.target.value);
                          validateField('content', e.target.value);
                        }}
                        className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 resize-none ${
                          fieldErrors.content 
                            ? 'border-red-300 bg-red-50 focus:border-red-500' 
                            : 'border-gray-200 focus:border-indigo-500 focus:bg-white'
                        } focus:ring-2 focus:ring-indigo-200 shadow-sm font-mono text-sm`}
                        placeholder="Rédigez ici le contenu complet de votre ressource...

Vous pouvez utiliser le Markdown pour formater votre texte :
- **gras** pour le texte en gras
- *italique* pour le texte en italique  
- ## Titre pour les titres
- - Liste à puces"
                        required
                      />
                      {fieldErrors.content && (
                        <span className="text-red-500 text-xs flex items-center gap-1">
                          <span>⚠️</span>
                          {fieldErrors.content}
                        </span>
                      )}
                    </div>

                    {/* Catégorie et Niveau - Grille 2 colonnes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Catégorie */}
                      <div className="space-y-2">
                        <label htmlFor="category" className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <span className="text-lg">🏷️</span>
                          Catégorie *
                        </label>
                        <select
                          id="category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="block w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 shadow-sm transition-all duration-200"
                          required
                        >
                          <option value="">Sélectionnez une catégorie</option>
                          {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.icon} {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Niveau de difficulté */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <span className="text-lg">📊</span>
                          Niveau de difficulté
                        </label>
                        <div className="space-y-2">
                          {levels.map((levelOption) => (
                            <label key={levelOption.value} className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-indigo-300 cursor-pointer transition-all">
                              <input
                                type="radio"
                                value={levelOption.value}
                                checked={level === levelOption.value}
                                onChange={(e) => setLevel(e.target.value)}
                                className="text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-xl">{levelOption.icon}</span>
                              <div className="flex-1">
                                <div className="font-medium text-gray-800">{levelOption.label}</div>
                                <div className="text-xs text-gray-500">{levelOption.description}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Temps de lecture et Tags - Grille 2 colonnes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Temps de lecture */}
                      <div className="space-y-2">
                        <label htmlFor="readingTime" className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <span className="text-lg">⏱️</span>
                          Temps de lecture
                          <span className="text-xs text-gray-500 font-normal">(ex: 5 min)</span>
                        </label>
                        <input
                          type="text"
                          id="readingTime"
                          value={readingTime}
                          onChange={(e) => {
                            setReadingTime(e.target.value);
                            validateField('readingTime', e.target.value);
                          }}
                          className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                            fieldErrors.readingTime 
                              ? 'border-red-300 bg-red-50 focus:border-red-500' 
                              : 'border-gray-200 focus:border-indigo-500 focus:bg-white'
                          } focus:ring-2 focus:ring-indigo-200 shadow-sm`}
                          placeholder="ex: 5 min"
                        />
                        {fieldErrors.readingTime && (
                          <span className="text-red-500 text-xs flex items-center gap-1">
                            <span>⚠️</span>
                            {fieldErrors.readingTime}
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      <div className="space-y-2">
                        <label htmlFor="tags" className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <span className="text-lg">🏷️</span>
                          Tags
                          <span className="text-xs text-gray-500 font-normal">(séparés par des virgules)</span>
                        </label>
                        <input
                          type="text"
                          id="tags"
                          value={tags}
                          onChange={(e) => setTags(e.target.value)}
                          className="block w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 shadow-sm transition-all duration-200"
                          placeholder="ex: stress, respiration, débutant"
                        />
                        {tags && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {tags.split(',').map((tag, index) => (
                              <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Média */}
                    <div className="space-y-4">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <span className="text-lg">📸</span>
                        Média
                        <span className="text-xs text-gray-500 font-normal">(optionnel)</span>
                      </label>
                      
                      {/* Upload zone */}
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors">
                        {!mediaUpload ? (
                          <div className="space-y-4">
                            <div className="flex flex-col items-center">
                              <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p className="text-sm text-gray-600">
                                Glissez-déposez un fichier ou cliquez pour sélectionner
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Images: JPEG, PNG, GIF, WebP | Vidéos: MP4, WebM, OGG | Max: 10MB
                              </p>
                            </div>
                            
                            <input
                              type="file"
                              id="media-upload"
                              accept="image/*,video/*"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                            
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                              <button
                                type="button"
                                onClick={() => document.getElementById('media-upload')?.click()}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                              >
                                <span className="mr-2">📁</span>
                                Choisir un fichier
                              </button>
                              
                              {selectedFile && (
                                <button
                                  type="button"
                                  onClick={handleUploadMedia}
                                  disabled={uploadingMedia}
                                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                                >
                                  {uploadingMedia ? (
                                    <>
                                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Upload...
                                    </>
                                  ) : (
                                    <>
                                      <span className="mr-2">⬆️</span>
                                      Uploader
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                            
                            {selectedFile && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-700">
                                  <span className="font-medium">Fichier sélectionné:</span> {selectedFile.name}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                  Taille: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Aperçu du média */}
                            <div className="max-w-md mx-auto">
                              {mediaUpload.type === 'image' && (
                                <div className="rounded-lg overflow-hidden">
                                  <img 
                                    src={mediaUpload.url} 
                                    alt="Aperçu"
                                    className="w-full h-48 object-cover"
                                  />
                                </div>
                              )}
                              {mediaUpload.type === 'video' && (
                                <div className="rounded-lg overflow-hidden">
                                  <video 
                                    src={mediaUpload.url}
                                    controls
                                    className="w-full h-48 object-cover"
                                  />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-center gap-2 text-sm text-green-700">
                              <span className="text-green-500">✅</span>
                              <span>Média uploadé avec succès</span>
                            </div>
                            
                            <button
                              type="button"
                              onClick={handleRemoveMedia}
                              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-xl text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                            >
                              <span className="mr-2">🗑️</span>
                              Supprimer le média
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                      >
                        <span className="mr-2">↩️</span>
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={loading || Object.keys(fieldErrors).length > 0}
                        className="flex-1 sm:flex-auto inline-flex items-center justify-center px-6 py-3 border-2 border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
                            <span className="mr-2">✨</span>
                            Créer la ressource
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
} 