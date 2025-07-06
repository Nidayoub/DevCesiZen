import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { diagnosticApi, infoResourcesApi } from '../services/api.service';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

interface DashboardScreenProps {
  navigation: DashboardScreenNavigationProp;
}

interface DiagnosticHistory {
  id: number;
  score: number;
  result_category: string;
  created_at: string;
}

interface InfoResource {
  id: number;
  title: string;
  category_name: string;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [resources, setResources] = useState<InfoResource[]>([]);
  const [diagnosticHistory, setDiagnosticHistory] = useState<DiagnosticHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les ressources récentes
      const resourcesResponse = await infoResourcesApi.getAll(3, 0);
      if (resourcesResponse?.data && Array.isArray(resourcesResponse.data)) {
        setResources(resourcesResponse.data.slice(0, 3));
      } else {
        setResources([]);
        console.log('Format de données de ressources inattendu:', resourcesResponse);
      }

      // Charger l'historique des diagnostics
      const diagnosticResponse = await diagnosticApi.getUserHistory();
      if (diagnosticResponse?.data && Array.isArray(diagnosticResponse.data)) {
        setDiagnosticHistory(diagnosticResponse.data.slice(0, 3));
      } else {
        setDiagnosticHistory([]);
        console.log('Format de données de diagnostic inattendu:', diagnosticResponse);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des données du tableau de bord:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  useEffect(() => {
    loadData();
    
    // Définir le message d'accueil en fonction de l'heure
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Bonjour');
    } else if (hour < 18) {
      setGreeting('Bon après-midi');
    } else {
      setGreeting('Bonsoir');
    }
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Chargement de votre tableau de bord...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4f46e5']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {greeting}, {user?.firstname}
        </Text>
        <Text style={styles.subtitle}>Bienvenue sur votre tableau de bord CESIZen</Text>
      </View>

      <View style={styles.userInfoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nom complet</Text>
          <Text style={styles.infoValue}>{user?.firstname} {user?.lastname}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Rôle</Text>
          <Text style={styles.infoValue}>
            {user?.role === 'user' && 'Utilisateur'}
            {user?.role === 'admin' && 'Administrateur'}
            {user?.role === 'super-admin' && 'Super Administrateur'}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Diagnostics récents</Text>
            <Text style={styles.cardSubtitle}>Vos dernières évaluations de stress</Text>
            
            {diagnosticHistory.length > 0 ? (
              diagnosticHistory.map((item) => (
                <View key={item.id} style={styles.historyItem}>
                  <Text style={styles.historyDate}>
                    {new Date(item.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                  <View style={styles.historyDetails}>
                    <Text style={styles.historyCategory}>{item.result_category}</Text>
                    <Text style={styles.historyScore}>{item.score} pts</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Aucun diagnostic récent</Text>
            )}
            
            <TouchableOpacity 
              style={styles.cardButton}
              onPress={() => navigation.navigate('Diagnostic')}
            >
              <Text style={styles.cardButtonText}>Nouveau diagnostic</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.gridItem}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ressources populaires</Text>
            <Text style={styles.cardSubtitle}>Contenus les plus consultés</Text>
            
            {resources.length > 0 ? (
              resources.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.resourceItem}
                  onPress={() => navigation.navigate('ResourceDetails', { id: item.id })}
                >
                  <Text style={styles.resourceTitle}>{item.title}</Text>
                  <Text style={styles.resourceCategory}>{item.category_name}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>Aucune ressource disponible</Text>
            )}
            
            <TouchableOpacity 
              style={styles.cardButton}
              onPress={() => navigation.navigate('Resources')}
            >
              <Text style={styles.cardButtonText}>Voir toutes les ressources</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Diagnostic')}
          >
            <Ionicons name="analytics" size={24} color="#4f46e5" />
            <Text style={styles.actionText}>Nouveau diagnostic</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Resources')}
          >
            <Ionicons name="book" size={24} color="#4f46e5" />
            <Text style={styles.actionText}>Ressources</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('LikedResources')}
          >
            <Ionicons name="heart" size={24} color="#ef4444" />
            <Text style={styles.actionText}>Mes likes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('DiagnosticHistory')}
          >
            <Ionicons name="document-text" size={24} color="#16a34a" />
            <Text style={styles.actionText}>Historique</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Info')}
          >
            <Ionicons name="information-circle" size={24} color="#4f46e5" />
            <Text style={styles.actionText}>Informations</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person" size={24} color="#4f46e5" />
            <Text style={styles.actionText}>Mon profil</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.recommendedSection}>
        <Text style={styles.sectionTitle}>Ressources recommandées</Text>
        
        <View style={styles.recommendedList}>
          <TouchableOpacity style={styles.recommendedItem}>
            <Ionicons name="book" size={20} color="#4f46e5" />
            <Text style={styles.recommendedText}>Méditation guidée</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.recommendedItem}>
            <Ionicons name="document-text" size={20} color="#4f46e5" />
            <Text style={styles.recommendedText}>Articles bien-être</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.recommendedItem}
            onPress={() => navigation.navigate('DiagnosticHistory')}
          >
            <Ionicons name="stats-chart" size={20} color="#4f46e5" />
            <Text style={styles.recommendedText}>Historique des évaluations</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#4f46e5',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
    marginTop: 4,
  },
  userInfoCard: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'column',
    padding: 8,
  },
  gridItem: {
    padding: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  historyItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  historyDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyCategory: {
    fontSize: 14,
    color: '#111827',
  },
  historyScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
  },
  resourceItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resourceTitle: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  resourceCategory: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 16,
  },
  cardButton: {
    marginTop: 16,
    paddingVertical: 10,
    backgroundColor: '#e0e7ff',
    borderRadius: 6,
    alignItems: 'center',
  },
  cardButtonText: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '600',
  },
  actionsSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  recommendedSection: {
    margin: 16,
  },
  recommendedList: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recommendedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  recommendedText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#4f46e5',
  },
});

export default DashboardScreen; 