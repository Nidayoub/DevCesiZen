import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import COLORS from '../constants/colors';
import { diagnosticApi } from '../services/api.service';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface DiagnosticHistory {
  id: number;
  score: number;
  stress_level: string;
  interpretation: string;
  created_at: string;
  selected_events_count?: number;
}

const { width } = Dimensions.get('window');

const DiagnosticHistoryScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [diagnostics, setDiagnostics] = useState<DiagnosticHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDiagnostics = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await diagnosticApi.getUserHistory();
      
      // L'API renvoie maintenant un objet avec une propriété diagnostics
      if (response.data && Array.isArray(response.data.diagnostics)) {
        setDiagnostics(response.data.diagnostics);
      } else if (Array.isArray(response.data)) {
        // Fallback pour l'ancien format si jamais
        setDiagnostics(response.data);
      } else {
        console.error('Format de réponse inattendu:', response.data);
        setDiagnostics([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      Alert.alert(
        'Erreur',
        'Impossible de charger l\'historique des diagnostics'
      );
      setDiagnostics([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDiagnostics(false);
    setRefreshing(false);
  }, []);

  const getStressLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'faible':
        return '#10B981';
      case 'modéré':
        return '#F59E0B';
      case 'élevé':
        return '#F97316';
      case 'très élevé':
        return '#EF4444';
      default:
        return COLORS.primary;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Ajuster pour le fuseau horaire français (UTC+1/+2)
      const offset = date.getTimezoneOffset();
      const frenchOffset = -60; // UTC+1 (ou -120 pour UTC+2 en été)
      const adjustedDate = new Date(date.getTime() + (frenchOffset - offset) * 60000);
      return adjustedDate.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const renderDiagnosticItem = ({ item }: { item: DiagnosticHistory }) => (
    <TouchableOpacity
      style={styles.diagnosticCard}
      onPress={() => navigation.navigate('DiagnosticResult', {
        score: item.score,
        stressLevel: item.stress_level,
        interpretation: item.interpretation,
        selectedEventsCount: item.selected_events_count || 0,
      })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Niveau de stress</Text>
          <Text style={[styles.stressLevel, { color: getStressLevelColor(item.stress_level) }]}>
            {item.stress_level}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteDiagnostic(item.id, item.stress_level)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.interpretation} numberOfLines={3}>
        {item.interpretation}
      </Text>
      
      <View style={styles.cardFooter}>
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
        {item.selected_events_count && (
          <Text style={styles.eventsCount}>
            {item.selected_events_count} événement{item.selected_events_count > 1 ? 's' : ''} sélectionné{item.selected_events_count > 1 ? 's' : ''}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const handleDeleteDiagnostic = (id: number, stressLevel: string) => {
    Alert.alert(
      'Supprimer le diagnostic',
      `Êtes-vous sûr de vouloir supprimer ce diagnostic ?\n\nNiveau de stress: ${stressLevel}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await diagnosticApi.deleteDiagnostic(id);
              // Actualiser la liste après suppression
              setDiagnostics(prev => prev.filter(diagnostic => diagnostic.id !== id));
              Alert.alert('Succès', 'Diagnostic supprimé avec succès');
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le diagnostic');
            }
          }
        }
      ]
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Aucun diagnostic</Text>
      <Text style={styles.emptyText}>
        Vous n'avez pas encore effectué de diagnostic de stress.
      </Text>
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigation.navigate('Diagnostic')}
      >
        <Text style={styles.startButtonText}>Commencer un diagnostic</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement de l'historique...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Historique des diagnostics</Text>
            <Text style={styles.subtitle}>
              {diagnostics.length} diagnostic{diagnostics.length > 1 ? 's' : ''} effectué{diagnostics.length > 1 ? 's' : ''}
            </Text>
          </View>
          {diagnostics.length > 0 && (
            <TouchableOpacity
              style={styles.statsButton}
              onPress={() => navigation.navigate('DiagnosticStats')}
            >
              <Ionicons name="analytics-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={diagnostics}
        renderItem={renderDiagnosticItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContainer,
          diagnostics.length === 0 && styles.emptyList
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyList: {
    flex: 1,
  },
  diagnosticCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scoreContainer: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  stressLevel: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  interpretation: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  date: {
    fontSize: 12,
    color: '#64748B',
  },
  eventsCount: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
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
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  statsButton: {
    padding: 8,
  },
});

export default DiagnosticHistoryScreen; 