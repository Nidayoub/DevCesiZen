'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '../../components/MainLayout';
import { useAuth } from '../../context/AuthContext';
import { emotionsApi } from '../../services/api.service';
import { Emotion, EmotionEntry } from '../../types';

export default function EmotionsJournalPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [entries, setEntries] = useState<EmotionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // État pour le formulaire d'ajout d'entrée
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<number | null>(null);
  const [intensity, setIntensity] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Date filtering
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  useEffect(() => {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    if (!isAuthenticated) {
      router.push('/login?redirect=/emotions');
      return;
    }
    
    fetchData();
  }, [isAuthenticated, router]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Charger les émotions disponibles
      const emotionsResponse = await emotionsApi.getAllEmotions();
      setEmotions(emotionsResponse.data.emotions);
      
      // Charger les entrées récentes
      const entriesResponse = await emotionsApi.getEntries(startDate, endDate);
      setEntries(entriesResponse.data.entries);
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données. Veuillez réessayer.');
      setLoading(false);
    }
  };
  
  const filterEntries = async () => {
    try {
      setLoading(true);
      const entriesResponse = await emotionsApi.getEntries(startDate, endDate);
      setEntries(entriesResponse.data.entries);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du filtrage des entrées:', err);
      setError('Impossible de filtrer les entrées. Veuillez réessayer.');
      setLoading(false);
    }
  };
  
  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmotion) {
      setError('Veuillez sélectionner une émotion');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await emotionsApi.createEntry({
        emotion_id: selectedEmotion,
        intensity,
        notes: notes || undefined
      });
      
      // Ajouter la nouvelle entrée au tableau
      setEntries([response.data.entry, ...entries]);
      
      // Réinitialiser le formulaire
      setSelectedEmotion(null);
      setIntensity(3);
      setNotes('');
      setShowAddForm(false);
      setSubmitting(false);
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'entrée:', err);
      setError('Impossible d\'ajouter l\'entrée. Veuillez réessayer.');
      setSubmitting(false);
    }
  };
  
  const handleDeleteEntry = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
      return;
    }
    
    try {
      await emotionsApi.deleteEntry(id);
      setEntries(entries.filter(entry => entry.id !== id));
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'entrée:', err);
      setError('Impossible de supprimer l\'entrée. Veuillez réessayer.');
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Journal émotionnel</h1>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="w-full md:w-2/3">
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Mes émotions récentes</h2>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Ajouter
                </button>
              </div>

              {/* Filtre de date */}
              <div className="bg-gray-50 rounded-md p-4 mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Filtrer par date</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label htmlFor="start_date" className="block text-xs font-medium text-gray-500">
                      Date de début
                    </label>
                    <input
                      type="date"
                      id="start_date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="end_date" className="block text-xs font-medium text-gray-500">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      id="end_date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={filterEntries}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Filtrer
                    </button>
                  </div>
                </div>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.5 19.5v-15m0 0H14a2 2 0 012 2v11a2 2 0 01-2 2H9.5m0-15H5a2 2 0 00-2 2v11a2 2 0 002 2h4.5" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Pas d'entrées</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Commencez à ajouter des entrées dans votre journal émotionnel.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <div key={entry.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div 
                            className="w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white text-lg"
                            style={{ backgroundColor: entry.emotion_color }}
                          >
                            {entry.emotion_icon ? (
                              <span role="img" aria-label={entry.emotion_name}>{entry.emotion_icon}</span>
                            ) : (
                              entry.emotion_name?.charAt(0)
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{entry.emotion_name}</h3>
                            <div className="flex items-center mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg 
                                  key={star}
                                  className={`h-4 w-4 ${star <= entry.intensity ? 'text-yellow-400' : 'text-gray-300'}`}
                                  xmlns="http://www.w3.org/2000/svg" 
                                  viewBox="0 0 20 20" 
                                  fill="currentColor"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                              <span className="ml-1 text-sm text-gray-500">Intensité</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(entry.date)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      {entry.notes && (
                        <div className="mt-2 pl-12">
                          <p className="text-sm text-gray-700">{entry.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full md:w-1/3">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Analyse</h2>
              <a
                href="/emotions/report"
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Voir les rapports
              </a>
            </div>
          </div>
        </div>
        
        {/* Formulaire d'ajout d'émotion */}
        {showAddForm && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">Ajouter une entrée</h3>
              </div>
              
              <form onSubmit={handleAddEntry}>
                <div className="px-6 py-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Émotion</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {emotions.map((emotion) => (
                        <button
                          key={emotion.id}
                          type="button"
                          onClick={() => setSelectedEmotion(emotion.id)}
                          className={`flex flex-col items-center p-2 rounded-md border ${
                            selectedEmotion === emotion.id
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-indigo-300'
                          }`}
                        >
                          <div 
                            className="w-8 h-8 rounded-full mb-1 flex items-center justify-center text-white"
                            style={{ backgroundColor: emotion.color }}
                          >
                            {emotion.icon ? (
                              <span>{emotion.icon}</span>
                            ) : (
                              emotion.name.charAt(0)
                            )}
                          </div>
                          <span className="text-xs">{emotion.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="intensity" className="block text-sm font-medium text-gray-700 mb-2">
                      Intensité
                    </label>
                    <div className="flex items-center">
                      <input
                        type="range"
                        id="intensity"
                        min="1"
                        max="5"
                        value={intensity}
                        onChange={(e) => setIntensity(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="ml-2 text-gray-700">{intensity}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (optionnel)
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Qu'est-ce qui a déclenché cette émotion ?"
                    ></textarea>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 flex justify-end rounded-b-lg">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="mr-2 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !selectedEmotion}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                  >
                    {submitting ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 