import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../constants/colors';
import { diagnosticApi } from '../services/api.service';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface DiagnosticHistory {
  id: number;
  score: number;
  stress_level: string;
  interpretation: string;
  created_at: string;
  selected_events_count?: number;
}

interface StatsData {
  totalDiagnostics: number;
  averageEventsCount: number;
  levelDistribution: { [key: string]: number };
  recentTrend: 'improving' | 'stable' | 'worsening' | 'insufficient_data';
  lastDiagnosticDate: string;
  mostFrequentLevel: string;
}

const { width } = Dimensions.get('window');

const DiagnosticStatsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [diagnostics, setDiagnostics] = useState<DiagnosticHistory[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDiagnostics = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await diagnosticApi.getUserHistory();
      
      if (Array.isArray(response.data)) {
        setDiagnostics(response.data);
        calculateStats(response.data);
      } else {
        console.error('Format de réponse inattendu:', response.data);
        setDiagnostics([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setDiagnostics([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const calculateStats = (data: DiagnosticHistory[]) => {
    if (data.length === 0) {
      setStats(null);
      return;
    }

    // Distribution des niveaux de stress
    const levelDistribution: { [key: string]: number } = {};
    let totalEventsCount = 0;
    
    data.forEach(diagnostic => {
      const level = diagnostic.stress_level;
      levelDistribution[level] = (levelDistribution[level] || 0) + 1;
      totalEventsCount += diagnostic.selected_events_count || 0;
    });

    // Niveau le plus fréquent
    const mostFrequentLevel = Object.entries(levelDistribution).reduce((a, b) => 
      levelDistribution[a[0]] > levelDistribution[b[0]] ? a : b
    )[0];

    // Tendance récente (comparaison des 3 derniers avec les 3 précédents)
    let recentTrend: 'improving' | 'stable' | 'worsening' | 'insufficient_data' = 'insufficient_data';
    
    if (data.length >= 6) {
      const recent = data.slice(0, 3);
      const previous = data.slice(3, 6);
      
      const recentAvgScore = recent.reduce((sum, d) => sum + d.score, 0) / recent.length;
      const previousAvgScore = previous.reduce((sum, d) => sum + d.score, 0) / previous.length;
      
      const difference = recentAvgScore - previousAvgScore;
      
      if (difference < -20) recentTrend = 'improving';
      else if (difference > 20) recentTrend = 'worsening';
      else recentTrend = 'stable';
    }

    setStats({
      totalDiagnostics: data.length,
      averageEventsCount: Math.round(totalEventsCount / data.length),
      levelDistribution,
      recentTrend,
      lastDiagnosticDate: data[0]?.created_at || '',
      mostFrequentLevel,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDiagnostics(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const getStressLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'faible':
      case 'faible risque':
        return '#10B981';
      case 'modéré':
      case 'risque modéré':
        return '#F59E0B';
      case 'élevé':
      case 'risque élevé':
        return '#EF4444';
      default:
        return COLORS.primary;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return { name: 'trending-down', color: '#10B981' };
      case 'worsening':
        return { name: 'trending-up', color: '#EF4444' };
      case 'stable':
        return { name: 'remove', color: '#F59E0B' };
      default:
        return { name: 'help', color: '#64748B' };
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'En amélioration';
      case 'worsening':
        return 'En détérioration';
      case 'stable':
        return 'Stable';
      default:
        return 'Données insuffisantes';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const renderLevelBar = (level: string, count: number, total: number) => {
    const percentage = (count / total) * 100;
    const color = getStressLevelColor(level);
    
    return (
      <View key={level} style={styles.levelBarContainer}>
        <View style={styles.levelBarHeader}>
          <Text style={styles.levelBarLabel}>{level}</Text>
          <Text style={styles.levelBarCount}>{count} ({Math.round(percentage)}%)</Text>
        </View>
        <View style={styles.levelBarTrack}>
          <View 
            style={[
              styles.levelBarFill, 
              { width: `${percentage}%`, backgroundColor: color }
            ]} 
          />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Calcul des statistiques...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="analytics-outline" size={64} color="#64748B" />
        <Text style={styles.emptyTitle}>Aucune statistique disponible</Text>
        <Text style={styles.emptyText}>
          Effectuez quelques diagnostics pour voir vos statistiques personnalisées.
        </Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('Diagnostic')}
        >
          <Text style={styles.startButtonText}>Commencer un diagnostic</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const trendIcon = getTrendIcon(stats.recentTrend);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Statistiques des diagnostics</Text>
        <Text style={styles.subtitle}>Analyse de votre bien-être</Text>
      </View>

      {/* Statistiques générales */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vue d'ensemble</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalDiagnostics}</Text>
            <Text style={styles.statLabel}>Diagnostics</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.averageEventsCount}</Text>
            <Text style={styles.statLabel}>Événements moyens</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{formatDate(stats.lastDiagnosticDate)}</Text>
            <Text style={styles.statLabel}>Dernier diagnostic</Text>
          </View>
        </View>
      </View>

      {/* Tendance */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tendance récente</Text>
        <View style={styles.trendContainer}>
          <Ionicons name={trendIcon.name} size={32} color={trendIcon.color} />
          <View style={styles.trendText}>
            <Text style={[styles.trendTitle, { color: trendIcon.color }]}>
              {getTrendText(stats.recentTrend)}
            </Text>
            <Text style={styles.trendDescription}>
              {stats.recentTrend === 'improving' && 'Votre niveau de stress semble s\'améliorer'}
              {stats.recentTrend === 'worsening' && 'Votre niveau de stress semble augmenter'}
              {stats.recentTrend === 'stable' && 'Votre niveau de stress est stable'}
              {stats.recentTrend === 'insufficient_data' && 'Effectuez plus de diagnostics pour voir la tendance'}
            </Text>
          </View>
        </View>
      </View>

      {/* Niveau le plus fréquent */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Niveau le plus fréquent</Text>
        <View style={styles.frequentLevelContainer}>
          <View style={[styles.frequentLevelBadge, { backgroundColor: getStressLevelColor(stats.mostFrequentLevel) }]}>
            <Text style={styles.frequentLevelText}>{stats.mostFrequentLevel}</Text>
          </View>
          <Text style={styles.frequentLevelCount}>
            {stats.levelDistribution[stats.mostFrequentLevel]} fois sur {stats.totalDiagnostics}
          </Text>
        </View>
      </View>

      {/* Répartition des niveaux */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Répartition des niveaux</Text>
        <View style={styles.distributionContainer}>
          {Object.entries(stats.levelDistribution).map(([level, count]) =>
            renderLevelBar(level, count, stats.totalDiagnostics)
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('DiagnosticHistory')}
        >
          <Ionicons name="list-outline" size={20} color={COLORS.primary} />
          <Text style={styles.actionButtonText}>Voir l'historique</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Diagnostic')}
        >
          <Ionicons name="add-outline" size={20} color={COLORS.primary} />
          <Text style={styles.actionButtonText}>Nouveau diagnostic</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    marginLeft: 16,
    flex: 1,
  },
  trendTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trendDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  frequentLevelContainer: {
    alignItems: 'center',
  },
  frequentLevelBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
  },
  frequentLevelText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  frequentLevelCount: {
    fontSize: 14,
    color: '#64748B',
  },
  distributionContainer: {
    gap: 16,
  },
  levelBarContainer: {
    marginBottom: 8,
  },
  levelBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  levelBarLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  levelBarCount: {
    fontSize: 14,
    color: '#64748B',
  },
  levelBarTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  levelBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 16,
    marginBottom: 100,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F8FAFC',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DiagnosticStatsScreen; 