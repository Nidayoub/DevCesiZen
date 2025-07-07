import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { resourcesApi, infoResourcesApi } from '../services/api.service';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import COLORS from '../constants/colors';
import ReportButton from '../components/ReportButton';

type ResourcesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Resources'>;

interface ResourcesScreenProps {
  navigation: ResourcesScreenNavigationProp;
}

interface Resource {
  id: number;
  title: string;
  description: string;
  category_name: string;
  category_id: number;
  created_at: string;
  updated_at: string;
}

const ResourcesScreen: React.FC<ResourcesScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadResources = async () => {
    try {
      setLoading(true);
      // Utiliser infoResourcesApi qui est aligné avec le FrontCesiZen
      const response = await infoResourcesApi.getAll();
      
      // Vérifier si response.data contient une propriété 'resources'
      if (response?.data && response.data.resources && Array.isArray(response.data.resources)) {
        setResources(response.data.resources);
      } else {
        console.log('Format de données de ressources inattendu:', response);
        setResources([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des ressources:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadResources();
  };

  useEffect(() => {
    loadResources();
  }, []);

  const renderItem = ({ item }: { item: Resource }) => (
    <View style={styles.resourceItem}>
      <TouchableOpacity 
        style={styles.resourceContent} 
        onPress={() => navigation.navigate('ResourceDetails', { id: item.id })}
      >
        <View style={styles.resourceHeader}>
          <Text style={styles.resourceTitle}>{item.title}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category_name || item.category}</Text>
          </View>
        </View>
        <Text style={styles.resourceDescription} numberOfLines={2}>
          {item.description || item.summary}
        </Text>
        <Text style={styles.dateText}>
          {new Date(item.created_at || item.publication_date).toLocaleDateString('fr-FR')}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.resourceActions}>
        <ReportButton 
          contentType="resource" 
          contentId={item.id}
          size="small"
        />
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Chargement des ressources...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user && (
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Ressources</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateResource')}
          >
            <Text style={styles.createButtonText}>+ Créer une ressource</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={resources}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4f46e5']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune ressource disponible</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  createButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
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
    color: COLORS.textMedium,
  },
  resourceItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4f46e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  resourceContent: {
    flex: 1,
    padding: 16,
  },
  resourceActions: {
    padding: 8,
    justifyContent: 'center',
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '500',
  },
  resourceDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMedium,
    textAlign: 'center',
  },
});

export default ResourcesScreen; 