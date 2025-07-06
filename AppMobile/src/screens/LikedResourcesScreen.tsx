import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { infoResourcesApi } from '../services/api.service';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import COLORS from '../constants/colors';

type LikedResourcesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'LikedResources'>;

interface LikedResourcesScreenProps {
  navigation: LikedResourcesScreenNavigationProp;
}

interface LikedResource {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  publication_date: string;
  reading_time: string;
  level: string;
  views: number;
  shares: number;
  likes_count: number;
  comments_count: number;
  tags: string[];
  like_date: string;
}

const LikedResourcesScreen: React.FC<LikedResourcesScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [likedResources, setLikedResources] = useState<LikedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLikedResources = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour voir vos ressources likées.');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const response = await infoResourcesApi.getUserLiked();
      
      if (response?.data && response.data.resources && Array.isArray(response.data.resources)) {
        setLikedResources(response.data.resources);
      } else {
        console.log('Format de données de ressources likées inattendu:', response);
        setLikedResources([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des ressources likées:', error);
      Alert.alert('Erreur', 'Impossible de charger vos ressources likées. Veuillez réessayer.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLikedResources();
  };

  // Recharger les données à chaque fois que l'écran devient visible
  useFocusEffect(
    useCallback(() => {
      loadLikedResources();
    }, [user])
  );

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return 'Date inconnue';
    }
  };

  const renderItem = ({ item }: { item: LikedResource }) => (
    <TouchableOpacity 
      style={styles.resourceItem} 
      onPress={() => navigation.navigate('ResourceDetails', { id: item.id })}
    >
      <View style={styles.resourceHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.resourceTitle}>{item.title}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
        <View style={styles.likeIndicator}>
          <Ionicons name="heart" size={20} color="#ef4444" />
        </View>
      </View>
      
      <Text style={styles.resourceSummary} numberOfLines={2}>
        {item.summary}
      </Text>
      
      <View style={styles.metadata}>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#6b7280" />
            <Text style={styles.metaText}>{item.reading_time}</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="stats-chart-outline" size={14} color="#6b7280" />
            <Text style={styles.metaText}>{item.level}</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="heart" size={14} color="#6b7280" />
            <Text style={styles.metaText}>{item.likes_count}</Text>
          </View>
        </View>
        
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>Liké le {formatDate(item.like_date)}</Text>
        </View>
      </View>
      
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {item.tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Chargement de vos ressources likées...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes ressources likées</Text>
        <Text style={styles.headerSubtitle}>
          {likedResources.length} ressource{likedResources.length !== 1 ? 's' : ''} likée{likedResources.length !== 1 ? 's' : ''}
        </Text>
      </View>
      
      <FlatList
        data={likedResources}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContainer,
          likedResources.length === 0 && styles.emptyListContainer
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4f46e5']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Aucune ressource likée</Text>
            <Text style={styles.emptyText}>
              Parcourez les ressources disponibles et likez celles qui vous intéressent !
            </Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => navigation.navigate('Resources')}
            >
              <Text style={styles.exploreButtonText}>Explorer les ressources</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyListContainer: {
    flexGrow: 1,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '500',
  },
  likeIndicator: {
    marginLeft: 12,
  },
  resourceSummary: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  metadata: {
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#6b7280',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default LikedResourcesScreen; 