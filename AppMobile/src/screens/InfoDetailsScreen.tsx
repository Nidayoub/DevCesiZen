import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { infoResourcesApi } from '../services/api.service';
import COLORS from '../constants/colors';
import ReportButton from '../components/ReportButton';

type InfoDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'InfoDetails'>;
type InfoDetailsScreenRouteProp = RouteProp<RootStackParamList, 'InfoDetails'>;

interface InfoDetailsScreenProps {
  navigation: InfoDetailsScreenNavigationProp;
  route: InfoDetailsScreenRouteProp;
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

const InfoDetailsScreen: React.FC<InfoDetailsScreenProps> = ({ navigation, route }) => {
  const { id } = route.params;
  const [resource, setResource] = useState<InfoResource | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResource();
  }, [id]);

  const loadResource = async () => {
    try {
      setLoading(true);
      const response = await infoResourcesApi.getById(id);
      
      if (response?.data) {
        setResource(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'article:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Chargement de l'article...</Text>
      </View>
    );
  }

  if (!resource) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Article non trouvé</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {resource.image_url && (
        <Image 
          source={{ uri: resource.image_url }} 
          style={styles.headerImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.content}>
        <View style={styles.categoryContainer}>
          <Text style={styles.category}>{resource.category_name}</Text>
        </View>
        
        <Text style={styles.title}>{resource.title}</Text>
        
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {new Date(resource.created_at).toLocaleDateString('fr-FR')}
          </Text>
          <View style={styles.stats}>
            <Text style={styles.statText}>{resource.views_count} vues</Text>
            <Text style={styles.statText}>{resource.likes_count} likes</Text>
          </View>
        </View>
        
        <View style={styles.actions}>
          <ReportButton 
            contentType="resource" 
            contentId={resource.id}
            size="small"
          />
        </View>
        
        <Text style={styles.description}>{resource.description}</Text>
        
        {resource.content && (
          <View style={styles.contentSection}>
            <Text style={styles.contentText}>{resource.content}</Text>
          </View>
        )}
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
    color: COLORS.textMedium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textMedium,
  },
  headerImage: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: 20,
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  category: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    lineHeight: 32,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  statText: {
    fontSize: 14,
    color: '#6b7280',
  },
  actions: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 24,
  },
  contentSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4f46e5',
  },
  contentText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
});

export default InfoDetailsScreen; 