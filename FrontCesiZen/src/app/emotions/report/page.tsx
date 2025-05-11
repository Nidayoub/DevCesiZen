'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '../../../components/MainLayout';
import { useAuth } from '../../../context/AuthContext';
import { emotionsApi } from '../../../services/api.service';
import { EmotionReport } from '../../../types';

// Nous utiliserons Chart.js pour les graphiques. Mais comme c'est un composant client,
// il doit être importé dynamiquement pour éviter les erreurs SSR
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('react-chartjs-2'), { ssr: false });
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Enregistrement des composants Chart.js nécessaires
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function EmotionsReportPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  const [report, setReport] = useState<EmotionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  
  useEffect(() => {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    if (!isAuthenticated) {
      router.push('/login?redirect=/emotions/report');
      return;
    }
    
    fetchReport();
  }, [isAuthenticated, router, selectedPeriod]);
  
  const fetchReport = async () => {
    try {
      setLoading(true);
      
      const response = await emotionsApi.getReport(selectedPeriod);
      setReport(response.data.report);
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement du rapport:', err);
      setError('Impossible de charger les données. Veuillez réessayer.');
      setLoading(false);
    }
  };
  
  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'week': return 'dernière semaine';
      case 'month': return 'dernier mois';
      case 'quarter': return 'dernier trimestre';
      case 'year': return 'dernière année';
      default: return 'dernier mois';
    }
  };
  
  // Préparation des données pour les graphiques
  const prepareLineChartData = () => {
    if (!report) return null;
    
    // Récupérer toutes les dates uniques
    const allDates = Array.from(
      new Set(
        report.summary.map(item => item.date)
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      )
    );
    
    // Créer un dataset pour chaque émotion
    const datasets = Object.values(
      report.data.map(emotion => ({
        label: emotion.name,
        data: allDates.map(date => {
          const entry = emotion.data.find(d => d.date === date);
          return entry ? entry.intensity : null;
        }),
        borderColor: emotion.color,
        backgroundColor: `${emotion.color}33`, // Ajouter transparence
        fill: false,
        tension: 0.1
      }))
    );
    
    return {
      labels: allDates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      }),
      datasets
    };
  };
  
  const prepareEmotionDistributionData = () => {
    if (!report) return null;
    
    // Agréger les émotions par nombre d'occurrences
    const emotionCounts = report.summary.reduce((acc, item) => {
      if (!acc[item.emotion_name]) {
        acc[item.emotion_name] = {
          count: 0,
          color: item.emotion_color
        };
      }
      acc[item.emotion_name].count += item.count;
      return acc;
    }, {} as Record<string, { count: number, color: string }>);
    
    return {
      labels: Object.keys(emotionCounts),
      datasets: [
        {
          data: Object.values(emotionCounts).map(item => item.count),
          backgroundColor: Object.values(emotionCounts).map(item => item.color),
        }
      ]
    };
  };
  
  const lineChartData = prepareLineChartData();
  const pieChartData = prepareEmotionDistributionData();
  
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Intensité des émotions sur la ${getPeriodLabel()}`
      }
    },
    scales: {
      y: {
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1
        }
      }
    }
  };
  
  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: `Distribution des émotions sur la ${getPeriodLabel()}`
      }
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rapports émotionnels</h1>
          <Link
            href="/emotions"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Retour au journal
          </Link>
        </div>
        
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
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Analyse de vos émotions</h2>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedPeriod('week')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedPeriod === 'week'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Semaine
              </button>
              <button
                onClick={() => setSelectedPeriod('month')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedPeriod === 'month'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Mois
              </button>
              <button
                onClick={() => setSelectedPeriod('quarter')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedPeriod === 'quarter'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Trimestre
              </button>
              <button
                onClick={() => setSelectedPeriod('year')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedPeriod === 'year'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Année
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : !report || !report.summary.length ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Pas de données</h3>
              <p className="mt-1 text-sm text-gray-500">
                Aucune donnée n'est disponible pour la période sélectionnée.
              </p>
              <div className="mt-6">
                <Link
                  href="/emotions"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Ajouter des entrées
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Graphique d'intensité des émotions */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="h-80">
                  {lineChartData && <Chart type="line" data={lineChartData} options={lineChartOptions} />}
                </div>
              </div>
              
              {/* Distribution des émotions */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="h-80">
                  {pieChartData && <Chart type="doughnut" data={pieChartData} options={pieChartOptions} />}
                </div>
              </div>
              
              {/* Insights sur vos émotions */}
              <div className="lg:col-span-2 bg-indigo-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-indigo-900 mb-4">Insights sur vos émotions</h3>
                <div className="space-y-4">
                  {report && (
                    <>
                      <p className="text-indigo-700">
                        Sur la {getPeriodLabel()}, vous avez enregistré {report.summary.reduce((sum, item) => sum + item.count, 0)} émotions.
                      </p>
                      
                      {report.data.length > 0 && (
                        <p className="text-indigo-700">
                          L'émotion la plus fréquente était {
                            report.data.sort((a, b) => 
                              b.data.reduce((sum, item) => sum + item.count, 0) - 
                              a.data.reduce((sum, item) => sum + item.count, 0)
                            )[0].name
                          }.
                        </p>
                      )}
                      
                      {report.data.length > 1 && (
                        <p className="text-indigo-700">
                          L'émotion la plus intense était {
                            report.data.sort((a, b) => 
                              b.data.reduce((sum, item) => sum + item.intensity, 0) / b.data.length - 
                              a.data.reduce((sum, item) => sum + item.intensity, 0) / a.data.length
                            )[0].name
                          }.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
} 