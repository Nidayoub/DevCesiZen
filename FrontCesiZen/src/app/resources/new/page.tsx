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
  const [categories, setCategories] = useState<{id: number, name: string, description?: string}[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [mediaUpload, setMediaUpload] = useState<{type: 'image' | 'video', content: string, filename: string} | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const levels = [
    { value: 'debutant', label: 'Débutant', icon: '🌱', description: 'Accessible à tous', color: 'bg-green-50 border-green-200 text-green-800' },
    { value: 'intermediaire', label: 'Intermédiaire', icon: '🌿', description: 'Quelques connaissances requises', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
    { value: 'avance', label: 'Avancé', icon: '🌳', description: 'Expertise recommandée', color: 'bg-blue-50 border-blue-200 text-blue-800' }
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesApi.getAll();
        setCategories(response.data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
        // Fallback vers les catégories par défaut si l'API échoue
        setCategories([
          { id: 1, name: 'generale', description: 'Catégorie générale' },
          { id: 2, name: 'stress', description: 'Gestion du stress' },
          { id: 3, name: 'sommeil', description: 'Amélioration du sommeil' },
          { id: 4, name: 'alimentation', description: 'Nutrition et alimentation' },
          { id: 5, name: 'exercice', description: 'Activité physique' },
          { id: 6, name: 'meditation', description: 'Méditation et pleine conscience' },
      
          { id: 8, name: 'productivite', description: 'Productivité et organisation' },
          { id: 9, name: 'motivation', description: 'Motivation et développement personnel' },
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

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
        } else if (value.length < 50) {
          errors.content = 'Le contenu doit contenir au moins 50 caractères';
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

  const getCharacterCount = (text: string, max: number) => {
    const count = text.length;
    const percentage = (count / max) * 100;
    const colorClass = percentage > 90 ? 'text-red-500' : percentage > 70 ? 'text-orange-500' : 'text-gray-500';
    return (
      <span className={`text-xs font-medium ${colorClass}`}>
        {count}/{max}
      </span>
    );
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Le fichier ne peut pas dépasser 10 MB');
        return;
      }
      
      // Upload automatique dès la sélection
      try {
        setMediaUpload(null);
        setUploadingMedia(true);
        setError('');
        
        const response = await mediaApi.upload(file);
        setMediaUpload(response.data.media);
      } catch (err) {
        console.error('Erreur upload média:', err);
        setError('Impossible d\'uploader le média');
      } finally {
        setUploadingMedia(false);
      }
    }
  };

  const handleUploadMedia = async () => {
    // Cette fonction n'est plus nécessaire car l'upload est automatique
    // Mais on la garde pour éviter les erreurs
    return;
  };

  const handleRemoveMedia = () => {
    setMediaUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation complète
    validateField('title', title);
    validateField('summary', summary);
    validateField('content', content);
    validateField('readingTime', readingTime);
    
    if (!category) {
      setError('Veuillez sélectionner une catégorie');
      return;
    }
    
    if (Object.keys(fieldErrors).length > 0) {
      setError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const resourceData = {
        title,
        summary,
        content,
        category,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        reading_time: readingTime || undefined,
        level,
        media_type: mediaUpload?.type || undefined,
        media_content: mediaUpload?.content || undefined,
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
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-10">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-4xl">✨</span>
                Créer une nouvelle ressource
              </h1>
              <p className="text-indigo-100 mt-3 text-lg">
                Partagez une ressource utile avec la communauté CesiZen
              </p>
            </div>

            <div className="p-8">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg">
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2 text-lg">⚠️</span>
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Titre */}
                <div className="space-y-2">
                  <label htmlFor="title" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span className="text-xl">✏️</span>
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
                    } focus:ring-2 focus:ring-indigo-200 shadow-sm text-lg`}
                    placeholder="Donnez un titre accrocheur à votre ressource..."
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
                  <label htmlFor="summary" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span className="text-xl">📄</span>
                    Résumé *
                  </label>
                  <textarea
                    id="summary"
                    value={summary}
                    onChange={(e) => {
                      setSummary(e.target.value);
                      validateField('summary', e.target.value);
                    }}
                    rows={4}
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
                  <label htmlFor="content" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span className="text-xl">📖</span>
                    Contenu *
                    <span className="text-xs text-gray-500 font-normal">(Markdown supporté)</span>
                  </label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      validateField('content', e.target.value);
                    }}
                    rows={12}
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
                    <label htmlFor="category" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      Catégorie *
                    </label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="block w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 shadow-sm transition-all duration-200"
                      required
                      disabled={loadingCategories}
                    >
                      <option value="">
                        {loadingCategories ? 'Chargement...' : 'Sélectionnez une catégorie'}
                      </option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                          {cat.description && ` - ${cat.description}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Niveau de difficulté */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <span className="text-xl">📊</span>
                      Niveau de difficulté
                    </label>
                    <div className="space-y-2">
                      {levels.map((levelOption) => (
                        <label key={levelOption.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          level === levelOption.value 
                            ? `${levelOption.color} border-current` 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <input
                            type="radio"
                            value={levelOption.value}
                            checked={level === levelOption.value}
                            onChange={(e) => setLevel(e.target.value)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-2xl">{levelOption.icon}</span>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">{levelOption.label}</div>
                            <div className="text-xs text-gray-600">{levelOption.description}</div>
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
                    <label htmlFor="readingTime" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <span className="text-xl">⏱️</span>
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
                    <label htmlFor="tags" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <span className="text-xl">🏷️</span>
                      Tags
                      <span className="text-xs text-gray-500 font-normal">(séparés par des virgules)</span>
                    </label>
                    <input
                      type="text"
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="block w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 shadow-sm transition-all duration-200"
                      placeholder="ex: relaxation, bien-être, santé mentale"
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
                    <p className="text-xs text-gray-500">
                      Ajoutez des mots-clés pour aider les autres à trouver votre ressource
                    </p>
                  </div>
                </div>

                {/* Média */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span className="text-xl">📷</span>
                    Média
                    <span className="text-xs text-gray-500 font-normal">(optionnel)</span>
                  </label>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-indigo-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={uploadingMedia}
                    />
                    
                    {!uploadingMedia && !mediaUpload && (
                      <div className="text-center">
                        <div className="text-6xl mb-4">📎</div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center px-6 py-3 border-2 border-indigo-500 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors font-medium"
                        >
                          <span className="mr-2">📁</span>
                          Sélectionner un fichier
                        </button>
                        <p className="text-xs text-gray-500 mt-3">
                          Le fichier sera automatiquement uploadé après sélection<br/>
                          Formats acceptés: JPEG, PNG, GIF, WebP pour les images | MP4, WebM, OGG pour les vidéos (max 10MB)
                        </p>
                      </div>
                    )}
                    
                    {uploadingMedia && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-center">
                          <div className="flex items-center gap-3">
                            <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <div>
                              <p className="font-medium text-blue-900">Upload en cours...</p>
                              <p className="text-sm text-blue-700">Veuillez patienter</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {mediaUpload && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">✅</span>
                            <div>
                              <p className="font-semibold text-green-900">Média uploadé avec succès!</p>
                              <p className="text-sm text-green-700">Type: {mediaUpload.type} | Fichier: {mediaUpload.filename}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveMedia}
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                        <div className="mt-3">
                          {mediaUpload.type === 'image' && (
                            <img src={mediaUpload.content} alt="Prévisualisation" className="max-w-xs max-h-40 object-cover rounded-lg shadow-sm" />
                          )}
                          {mediaUpload.type === 'video' && (
                            <video src={mediaUpload.content} controls className="max-w-xs max-h-40 rounded-lg shadow-sm" />
                          )}
                          
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm font-medium text-green-800">✅ Ce média sera automatiquement affiché avec votre ressource</p>
                            <p className="text-xs text-green-600 mt-1">Aucune action supplémentaire nécessaire</p>
                          </div>
                        </div>
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
                        Création...
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
      </MainLayout>
    </ProtectedRoute>
  );
} 