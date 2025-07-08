import React, { useState, useEffect } from 'react';
import COLORS from '../constants/colors';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  ScrollView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { infoApi, infoResourcesApi } from '../services/api.service';
import { useAuth } from '../context/AuthContext';
import ReportButton from '../components/ReportButton';

type InfoScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Info'>;

interface InfoScreenProps {
  navigation: InfoScreenNavigationProp;
}

interface InfoResource {
  id: number;
  title: string;
  description: string;
  content: string;
  image_url: string;
  category_name: string;
  created_at: string;
  likes_count: number;
  views_count: number;
}

const InfoScreen: React.FC<InfoScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [resources, setResources] = useState<InfoResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);

  const loadResources = async (category = 'all') => {
    try {
      setLoading(true);
      let response;
      if (category === 'all') {
        response = await infoResourcesApi.getAll();
      } else {
        response = await infoResourcesApi.getByCategory(category);
      }
      
      if (response?.data && Array.isArray(response.data)) {
        setResources(response.data);
      } else {
        console.log('Format de données de ressources inattendu:', response);
        setResources([]);
      }
      
      // Charger les catégories
      if (categories.length === 0) {
        const categoriesResponse = await infoApi.getAll();
        
        if (categoriesResponse?.data && Array.isArray(categoriesResponse.data)) {
          setCategories(categoriesResponse.data);
        } else {
          console.log('Format de données de catégories inattendu:', categoriesResponse);
          setCategories([]);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des informations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadResources(selectedCategory);
  };

  useEffect(() => {
    loadResources();
  }, []);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    loadResources(category);
  };

  const renderItem = ({ item }: { item: InfoResource }) => (
    <View style={styles.resourceCard}>
      <TouchableOpacity
        style={styles.resourceCardContent}
        onPress={() => navigation.navigate('InfoDetails', { id: item.id })}
      >
        {item.image_url && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: item.image_url }} 
              style={styles.resourceImage}
              resizeMode="cover"
            />
          </View>
        )}
        
        <View style={styles.resourceContent}>
          <Text style={styles.resourceCategory}>{item.category_name}</Text>
          <Text style={styles.resourceTitle}>{item.title}</Text>
          <Text style={styles.resourceDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.resourceMeta}>
            <Text style={styles.resourceDate}>
                                      {(() => {
                          const date = new Date(item.created_at);
                          const offset = date.getTimezoneOffset();
                          const frenchOffset = -60;
                          const adjustedDate = new Date(date.getTime() + (frenchOffset - offset) * 60000);
                          return adjustedDate.toLocaleDateString('fr-FR');
                        })()}
            </Text>
            <View style={styles.resourceStats}>
              <Text style={styles.statText}>{item.views_count} vues</Text>
                                    <Text style={styles.statText}>{item.likes_count} like{item.likes_count !== 1 ? 's' : ''}</Text>
            </View>
          </View>
        </View>
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
        <Text style={styles.loadingText}>Chargement des articles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={resources}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4f46e5']}
          />
        }
        ListHeaderComponent={
          <View style={styles.categoriesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  selectedCategory === 'all' && styles.categoryButtonActive
                ]}
                onPress={() => handleCategorySelect('all')}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === 'all' && styles.categoryButtonTextActive
                ]}>
                  Tous
                </Text>
              </TouchableOpacity>
              
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.name && styles.categoryButtonActive
                  ]}
                  onPress={() => handleCategorySelect(category.name)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    selectedCategory === category.name && styles.categoryButtonTextActive
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun article disponible</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textMedium,
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesScroll: {
    paddingVertical: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryButtonActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  resourceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  resourceCardContent: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  resourceActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 4,
  },
  imageContainer: {
    height: 160,
    width: '100%',
  },
  resourceImage: {
    width: '100%',
    height: '100%',
  },
  resourceContent: {
    padding: 16,
  },
  resourceCategory: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
  },
  resourceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  resourceDate: {
    fontSize: 12,
    color: COLORS.textMedium,
  },
  resourceStats: {
    flexDirection: 'row',
  },
  statText: {
    fontSize: 12,
    color: COLORS.textMedium,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMedium,
  },
});

export default InfoScreen; 