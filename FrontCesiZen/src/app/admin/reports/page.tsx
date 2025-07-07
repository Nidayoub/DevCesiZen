'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import AdminMenu from '../../../components/AdminMenu';
import { reportsApi } from '../../../services/api.service';

interface Reporter {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
}

interface Reviewer {
  id: number;
  firstname: string;
  lastname: string;
}

interface ContentDetails {
  title?: string;
  content?: string;
  author?: {
    id: number;
    firstname: string;
    lastname: string;
  };
}

interface Report {
  id: number;
  content_type: 'comment' | 'resource';
  content_id: number;
  reported_by: number;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  reporter: Reporter;
  reviewer?: Reviewer;
  content_details?: ContentDetails;
}

interface Statistics {
  total: number;
  pending: number;
  reviewed: number;
  resolved: number;
  dismissed: number;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-800'
};

const statusLabels = {
  pending: 'En attente',
  reviewed: 'Examiné',
  resolved: 'Résolu',
  dismissed: 'Rejeté'
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchStatistics();
  }, [selectedStatus]);

  const fetchReports = async () => {
    try {
      const response = await reportsApi.getAll(selectedStatus || undefined);
      setReports(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des signalements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await reportsApi.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const updateReportStatus = async (reportId: number, newStatus: 'reviewed' | 'resolved' | 'dismissed') => {
    try {
      await reportsApi.updateStatus(reportId, newStatus);
      await fetchReports();
      await fetchStatistics();
      setIsModalOpen(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const deleteReport = async (reportId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce signalement ?')) {
      return;
    }

    try {
      await reportsApi.delete(reportId);
      await fetchReports();
      await fetchStatistics();
      setIsModalOpen(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const openReportModal = (report: Report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const renderReportModal = () => {
    if (!selectedReport || !isModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-6 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Détails du signalement #{selectedReport.id}
            </h3>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Informations du signalement</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Type:</span> {selectedReport.content_type === 'comment' ? 'Commentaire' : 'Ressource'}</p>
                <p><span className="font-medium">Raison:</span> {selectedReport.reason}</p>
                <p><span className="font-medium">Statut:</span> 
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedReport.status]}`}>
                    {statusLabels[selectedReport.status]}
                  </span>
                </p>
                <p><span className="font-medium">Signalé le:</span> {formatDate(selectedReport.created_at)}</p>
                {selectedReport.description && (
                  <p><span className="font-medium">Description:</span> {selectedReport.description}</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Signalé par</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Nom:</span> {selectedReport.reporter.firstname} {selectedReport.reporter.lastname}</p>
                <p><span className="font-medium">Email:</span> {selectedReport.reporter.email}</p>
              </div>

              {selectedReport.reviewer && (
                <>
                  <h4 className="font-medium text-gray-900 mb-2 mt-4">Examiné par</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Nom:</span> {selectedReport.reviewer.firstname} {selectedReport.reviewer.lastname}</p>
                    <p><span className="font-medium">Date:</span> {selectedReport.reviewed_at ? formatDate(selectedReport.reviewed_at) : 'N/A'}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {selectedReport.content_details && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Contenu signalé</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                {selectedReport.content_details.title && (
                  <p className="font-medium mb-2">{selectedReport.content_details.title}</p>
                )}
                {selectedReport.content_details.content && (
                  <p className="text-sm text-gray-700 mb-2">{selectedReport.content_details.content}</p>
                )}
                {selectedReport.content_details.author && (
                  <p className="text-xs text-gray-500">
                    Auteur: {selectedReport.content_details.author.firstname} {selectedReport.content_details.author.lastname}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {selectedReport.status !== 'reviewed' && (
                <button
                  onClick={() => updateReportStatus(selectedReport.id, 'reviewed')}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Marquer comme examiné
                </button>
              )}
              {selectedReport.status !== 'resolved' && (
                <button
                  onClick={() => updateReportStatus(selectedReport.id, 'resolved')}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                >
                  Marquer comme résolu
                </button>
              )}
              {selectedReport.status !== 'dismissed' && (
                <button
                  onClick={() => updateReportStatus(selectedReport.id, 'dismissed')}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-600 border border-transparent rounded-md hover:bg-gray-700"
                >
                  Rejeter
                </button>
              )}
            </div>

            <button
              onClick={() => deleteReport(selectedReport.id)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        <AdminMenu />
        
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Gestion des signalements</h1>
              <p className="mt-2 text-sm text-gray-600">
                Gérez les signalements de contenu de la plateforme
              </p>
            </div>

            {/* Statistiques */}
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                          <dd className="text-lg font-medium text-gray-900">{statistics.total}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">En attente</dt>
                          <dd className="text-lg font-medium text-yellow-600">{statistics.pending}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Examinés</dt>
                          <dd className="text-lg font-medium text-blue-600">{statistics.reviewed}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Résolus</dt>
                          <dd className="text-lg font-medium text-green-600">{statistics.resolved}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Rejetés</dt>
                          <dd className="text-lg font-medium text-gray-600">{statistics.dismissed}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filtres */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Filtrer par statut:</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="mt-1 block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">Tous</option>
                    <option value="pending">En attente</option>
                    <option value="reviewed">Examinés</option>
                    <option value="resolved">Résolus</option>
                    <option value="dismissed">Rejetés</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Liste des signalements */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">Aucun signalement trouvé.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {reports.map((report) => (
                    <li key={report.id}>
                      <div 
                        className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
                        onClick={() => openReportModal(report)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {report.content_type === 'comment' ? 'Commentaire' : 'Ressource'}
                              </span>
                            </div>
                            <div className="ml-4 flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {report.reason}
                              </p>
                              <p className="text-sm text-gray-500">
                                Signalé par {report.reporter.firstname} {report.reporter.lastname} • {formatDate(report.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[report.status]}`}>
                              {statusLabels[report.status]}
                            </span>
                            <svg className="ml-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {renderReportModal()}
      </div>
    </ProtectedRoute>
  );
} 