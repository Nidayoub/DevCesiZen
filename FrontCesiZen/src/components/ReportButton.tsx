'use client';

import { useState } from 'react';

interface ReportButtonProps {
  contentType: 'comment' | 'resource';
  contentId: number;
  className?: string;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description?: string) => Promise<void>;
  contentType: 'comment' | 'resource';
}

function ReportModal({ isOpen, onClose, onSubmit, contentType }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = [
    'Contenu inapproprié',
    'Spam ou publicité',
    'Harcèlement',
    'Fausses informations',
    'Discours de haine',
    'Violation des règles de la communauté',
    'Autre'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    setIsSubmitting(true);
    try {
      await onSubmit(reason, description || undefined);
      onClose();
      setReason('');
      setDescription('');
    } catch (error) {
      console.error('Erreur lors du signalement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Signaler {contentType === 'comment' ? 'ce commentaire' : 'cette ressource'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison du signalement *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Sélectionnez une raison</option>
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optionnel)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ajoutez des détails si nécessaire..."
              />
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!reason || isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Signalement...' : 'Signaler'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ReportButton({ contentType, contentId, className = '' }: ReportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReported, setIsReported] = useState(false);

  const handleReport = async (reason: string, description?: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Vous devez être connecté pour signaler du contenu');
        return;
      }

      const response = await fetch('http://localhost:3000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          reason,
          description
        })
      });

      if (response.ok) {
        setIsReported(true);
        alert('Signalement envoyé avec succès. Nos équipes vont examiner votre signalement.');
      } else if (response.status === 409) {
        alert('Vous avez déjà signalé ce contenu.');
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error || 'Impossible d\'envoyer le signalement'}`);
      }
    } catch (error) {
      console.error('Erreur lors du signalement:', error);
      alert('Erreur lors de l\'envoi du signalement. Veuillez réessayer.');
    }
  };

  if (isReported) {
    return (
      <button
        disabled
        className={`inline-flex items-center text-sm text-gray-500 cursor-not-allowed ${className}`}
      >
        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Signalé
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center text-sm text-gray-500 hover:text-red-600 transition-colors ${className}`}
        title={`Signaler ${contentType === 'comment' ? 'ce commentaire' : 'cette ressource'}`}
      >
        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6v1a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        Signaler
      </button>

      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleReport}
        contentType={contentType}
      />
    </>
  );
} 