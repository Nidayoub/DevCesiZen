import Link from 'next/link';
import { DiagnosticResult } from '../types';

interface DiagnosticCardProps {
  result?: DiagnosticResult | null;
  showCallToAction?: boolean;
}

export default function DiagnosticCard({ result, showCallToAction = true }: DiagnosticCardProps) {
  const getStressLevelColor = (stressLevel: string) => {
    const level = stressLevel.toLowerCase();
    if (level.includes('faible')) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (level.includes('modéré')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else if (level.includes('élevé')) {
      return 'bg-red-100 text-red-800 border-red-200';
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900">Diagnostic de stress</h3>
        <div className="mt-3">
          {result ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-gray-500">Votre score</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {result.total_score || result.score}
                  </p>
                </div>
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStressLevelColor(result.stress_level || result.stressLevel || '')}`}>
                    {result.stress_level || result.stressLevel}
                  </span>
                </div>
              </div>
              
              <div className="mt-4">
                <Link 
                  href={`/diagnostic/result?id=${result.resultId || 'latest'}`}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                >
                  Voir les détails
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Évaluez votre niveau de stress avec l'échelle scientifique de Holmes et Rahe.
              </p>
              {showCallToAction && (
                <Link 
                  href="/diagnostic"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                >
                  Faire un diagnostic
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 