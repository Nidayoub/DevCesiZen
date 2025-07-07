import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  Image
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { infoResourcesApi, categoriesApi, mediaApi } from '../services/api.service';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import COLORS from '../constants/colors';
import { MediaUpload, Category } from '../types/resource';
import SimpleMediaPicker from '../components/SimpleMediaPicker';

type EditResourceScreenRouteProp = RouteProp<RootStackParamList, 'EditResource'>;
type EditResourceScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditResource'>;

interface EditResourceScreenProps {
  route: EditResourceScreenRouteProp;
  navigation: EditResourceScreenNavigationProp;
}

const EditResourceScreen: React.FC<EditResourceScreenProps> = ({ route, navigation }) => {
  const { resourceId } = route.params;
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [readingTime, setReadingTime] = useState('');
  const [level, setLevel] = useState('debutant');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [mediaUpload, setMediaUpload] = useState<MediaUpload | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [originalResource, setOriginalResource] = useState<any>(null);

  useEffect(() => {
    loadResourceAndCategories();
  }, []);

  const loadResourceAndCategories = async () => {
    try {
      setInitialLoading(true);
      
      // Charger la ressource et les catégories en parallèle
      const [resourceResponse, categoriesResponse] = await Promise.all([
        infoResourcesApi.getById(resourceId),
        categoriesApi.getAll()
      ]);

      // Charger les données de la ressource
      if (resourceResponse?.data && resourceResponse.data.resource) {
        const resource = resourceResponse.data.resource;
        setOriginalResource(resource);
        setTitle(resource.title || '');
        setSummary(resource.summary || '');
        setContent(resource.content || '');
        setCategory(resource.category || '');
        setTags(resource.tags ? resource.tags.join(', ') : '');
        setReadingTime(resource.reading_time || '');
        setLevel(resource.level || 'debutant');
        
        // Charger les données média si elles existent
        if (resource.media_content) {
          setMediaUpload({
            type: resource.media_type || 'image',
            content: resource.media_content,
            filename: resource.media_filename || 'media'
          });
        }
      }

      // Charger les catégories
      if (categoriesResponse?.data) {
        setCategories(categoriesResponse.data || []);
      } else {
        // Fallback vers les catégories par défaut
        setCategories([
          { id: 1, name: 'generale' },
          { id: 2, name: 'stress' },
          { id: 3, name: 'sommeil' },
          { id: 4, name: 'alimentation' },
          { id: 5, name: 'exercice' },
          { id: 6, name: 'meditation' },
          { id: 7, name: 'respiration' },
          { id: 8, name: 'productivite' },
          { id: 9, name: 'motivation' },
        ]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      Alert.alert('Erreur', 'Impossible de charger la ressource');
      navigation.goBack();
    } finally {
      setInitialLoading(false);
      setLoadingCategories(false);
    }
  };

  const levels = [
    { value: 'debutant', label: 'Débutant' },
    { value: 'intermediaire', label: 'Intermédiaire' },
    { value: 'avance', label: 'Avancé' },
  ];

  const handleSubmit = async () => {
    if (!title || !summary || !content || !category) {
      Alert.alert('Erreur', 'Le titre, résumé, contenu et catégorie sont obligatoires');
      return;
    }

    try {
      setLoading(true);
      const resourceData = {
        title,
        summary,
        content,
        category,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        reading_time: readingTime || undefined,
        level,
        media_type: mediaUpload?.type || null,
        media_content: mediaUpload?.content || null,
        media_filename: mediaUpload?.filename || null
      };

      console.log('📤 Resource update data being sent:', resourceData);
      await infoResourcesApi.update(resourceId, resourceData);
      
      Alert.alert(
        'Succès', 
        'Ressource modifiée avec succès !',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Erreur modification ressource:', error);
      Alert.alert('Erreur', 'Impossible de modifier la ressource. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const CategoryPicker = () => {
    if (loadingCategories) {
      return (
        <View style={styles.pickerContainer}>
          <ActivityIndicator size="small" color="#4f46e5" />
          <Text style={styles.loadingText}>Chargement des catégories...</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.pickerContainer}>
        {categories.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.pickerItem,
              category === item.name && styles.pickerItemSelected
            ]}
            onPress={() => {
              setCategory(item.name);
              setShowCategoryPicker(false);
            }}
          >
            <Text style={[
              styles.pickerItemText,
              category === item.name && styles.pickerItemTextSelected
            ]}>
              {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const LevelPicker = () => (
    <ScrollView style={styles.pickerContainer}>
      {levels.map((item) => (
        <TouchableOpacity
          key={item.value}
          style={[
            styles.pickerItem,
            level === item.value && styles.pickerItemSelected
          ]}
          onPress={() => {
            setLevel(item.value);
            setShowLevelPicker(false);
          }}
        >
          <Text style={[
            styles.pickerItemText,
            level === item.value && styles.pickerItemTextSelected
          ]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Chargement de la ressource...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Modifier la ressource</Text>
          <Text style={styles.subtitle}>Modifiez les informations de votre ressource</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Titre *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Donnez un titre à votre ressource"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Résumé *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={summary}
              onChangeText={setSummary}
              placeholder="Résumé court de votre ressource"
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contenu *</Text>
            <TextInput
              style={[styles.input, styles.textAreaLarge]}
              value={content}
              onChangeText={setContent}
              placeholder="Contenu détaillé de votre ressource (vous pouvez utiliser du Markdown)"
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={8}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Catégorie *</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={styles.pickerText}>
                {category 
                  ? category.charAt(0).toUpperCase() + category.slice(1)
                  : loadingCategories ? 'Chargement...' : 'Sélectionner une catégorie'
                }
              </Text>
              <Text style={styles.pickerArrow}>{showCategoryPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showCategoryPicker && <CategoryPicker />}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Temps de lecture</Text>
            <TextInput
              style={styles.input}
              value={readingTime}
              onChangeText={setReadingTime}
              placeholder="ex: 5 min"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Niveau de difficulté</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowLevelPicker(!showLevelPicker)}
            >
              <Text style={styles.pickerText}>
                {levels.find(lvl => lvl.value === level)?.label || 'Sélectionner un niveau'}
              </Text>
              <Text style={styles.pickerArrow}>{showLevelPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showLevelPicker && <LevelPicker />}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tags (séparés par des virgules)</Text>
            <TextInput
              style={styles.input}
              value={tags}
              onChangeText={setTags}
              placeholder="relaxation, bien-être, santé mentale"
              placeholderTextColor={COLORS.textLight}
            />
            <Text style={styles.helper}>Ajoutez des mots-clés pour aider les autres à trouver votre ressource</Text>
          </View>

          <SimpleMediaPicker
            onFileSelected={(file) => setSelectedFile(file)}
            onUploadComplete={(media) => setMediaUpload(media)}
          />

          {mediaUpload && (
            <View style={styles.currentMediaContainer}>
              <Text style={styles.currentMediaTitle}>Média actuel:</Text>
              <Text style={styles.currentMediaText}>{mediaUpload.filename}</Text>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Modification...' : 'Modifier la ressource'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textAreaLarge: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: '#111827',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 200,
    backgroundColor: '#fff',
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerItemSelected: {
    backgroundColor: '#e0e7ff',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#111827',
  },
  pickerItemTextSelected: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  helper: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  currentMediaContainer: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  currentMediaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  currentMediaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default EditResourceScreen; 