import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { diagnosticApi } from '../services/api.service';
import { useAuth } from '../context/AuthContext';

type DiagnosticScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Diagnostic'>;

interface DiagnosticScreenProps {
  navigation: DiagnosticScreenNavigationProp;
}

interface Question {
  id: number;
  question?: string;
  title?: string; // Support des deux formats
  weight?: number;
  points?: number; // Support des deux formats
  category?: string;
  selected?: boolean;
}

interface DiagnosticHistory {
  id: number;
  score: number;
  result_category: string;
  created_at: string;
}

const DiagnosticScreen: React.FC<DiagnosticScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<DiagnosticHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  // Calculer la progression
  useEffect(() => {
    if (categories.length > 0) {
      const currentCategoryIndex = categories.indexOf(currentCategory || categories[0]);
      setProgress((currentCategoryIndex + 1) / (categories.length + 1) * 100);
    }
  }, [currentCategory, categories]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les questions du diagnostic
      const questionsResponse = await diagnosticApi.getQuestions();
      
      if (questionsResponse?.data) {
        // Vérifier si les données sont sous la forme d'un tableau d'événements ou dans une propriété 'events'
        const questionsData = questionsResponse.data.events || questionsResponse.data;
        
        if (Array.isArray(questionsData)) {
          const processedQuestions = questionsData.map((q: any) => ({
            id: q.id,
            question: q.question || q.title || q.event_text || 'Question sans texte',
            weight: q.weight || q.points || 0,
            category: q.category || 'Général',
            selected: false
          }));
          setQuestions(processedQuestions);
          
          // Extraire les catégories uniques
          const uniqueCategories = [...new Set(processedQuestions.map((q: any) => q.category))];
          setCategories(uniqueCategories);
          
          // Initialiser avec la première catégorie
          if (uniqueCategories.length > 0) {
            setCurrentCategory(uniqueCategories[0]);
          }
        } else {
          console.log('Format de données de questions inattendu:', questionsResponse);
          setQuestions([]);
        }
      } else {
        console.log('Aucune donnée reçue:', questionsResponse);
        setQuestions([]);
      }

      // Charger l'historique des diagnostics seulement pour les utilisateurs connectés
      if (user) {
        try {
          const historyResponse = await diagnosticApi.getUserHistory();
          
          // Vérifier si response.data contient une propriété 'diagnostics'
          if (historyResponse?.data && historyResponse.data.diagnostics && Array.isArray(historyResponse.data.diagnostics)) {
            setHistory(historyResponse.data.diagnostics);
          } else {
            console.log('Format de données d\'historique inattendu:', historyResponse);
            setHistory([]);
          }
        } catch (error) {
          console.error('Erreur lors du chargement de l\'historique:', error);
          // Ne pas bloquer le diagnostic si l'historique ne peut pas être chargé
          setHistory([]);
        }
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données du diagnostic:', error);
      Alert.alert('Erreur', 'Impossible de charger les questions du diagnostic');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (id: number) => {
    setQuestions(
      questions.map(q => 
        q.id === id ? { ...q, selected: !q.selected } : q
      )
    );
  };

  // Navigation entre catégories
  const goToNextCategory = () => {
    const currentIndex = categories.indexOf(currentCategory || '');
    if (currentIndex < categories.length - 1) {
      setCurrentCategory(categories[currentIndex + 1]);
    } else {
      submitDiagnostic();
    }
  };

  const goToPreviousCategory = () => {
    const currentIndex = categories.indexOf(currentCategory || '');
    if (currentIndex > 0) {
      setCurrentCategory(categories[currentIndex - 1]);
    }
  };

  const submitDiagnostic = async () => {
    try {
      setSubmitting(true);
      const selectedQuestions = questions
        .filter(q => q.selected)
        .map(q => q.id);

      if (selectedQuestions.length === 0) {
        Alert.alert('Aucune sélection', 'Veuillez sélectionner au moins un événement pour continuer.');
        return;
      }

      const response = await diagnosticApi.submitDiagnostic({ selectedEventIds: selectedQuestions });
      
      // Naviguer vers l'écran des résultats
      navigation.navigate('DiagnosticResult', {
        score: response.data.score,
        stressLevel: response.data.stressLevel || response.data.result_category,
        interpretation: response.data.interpretation || response.data.recommendation,
        selectedEventsCount: selectedQuestions.length
      });
      
      // Recharger les données pour l'historique si connecté
      if (user) {
        loadData();
      }
    } catch (error) {
      console.error('Erreur lors de la soumission du diagnostic:', error);
      Alert.alert('Erreur', 'Impossible de soumettre le diagnostic');
    } finally {
      setSubmitting(false);
    }
  };

  const renderHistoryItem = ({ item }: { item: DiagnosticHistory }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyDate}>
          {new Date(item.created_at).toLocaleDateString('fr-FR')}
        </Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{item.score} pts</Text>
        </View>
      </View>
      <Text style={styles.categoryText}>{item.result_category}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Chargement du diagnostic...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Diagnostic de Stress</Text>
        <Text style={styles.subtitle}>
          Sélectionnez les événements que vous avez vécus au cours des 12 derniers mois
        </Text>
      </View>

      {user && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, showHistory ? styles.activeButton : null]}
            onPress={() => setShowHistory(true)}
          >
            <Text style={[styles.actionButtonText, showHistory ? styles.activeButtonText : null]}>Historique</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, !showHistory ? styles.activeButton : null]}
            onPress={() => setShowHistory(false)}
          >
            <Text style={[styles.actionButtonText, !showHistory ? styles.activeButtonText : null]}>Nouveau diagnostic</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {!user && (
        <View style={styles.publicNotice}>
          <Text style={styles.publicNoticeText}>
            💡 Connectez-vous pour sauvegarder vos résultats et voir votre historique
          </Text>
        </View>
      )}

      {/* Barre de progression */}
      {!showHistory && categories.length > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Catégorie {categories.indexOf(currentCategory || categories[0]) + 1} sur {categories.length}
          </Text>
        </View>
      )}

      {showHistory ? (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun diagnostic réalisé</Text>
            </View>
          }
        />
      ) : (
        <>
          {currentCategory && (
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>{currentCategory}</Text>
            </View>
          )}

          <ScrollView style={styles.questionsContainer}>
            {questions.length === 0 ? (
              <View style={styles.noQuestionsContainer}>
                <Text style={styles.noQuestionsText}>
                  Aucune question chargée. Vérifiez votre connexion.
                </Text>
              </View>
            ) : (
              questions
                .filter(question => question.category === currentCategory)
                .map((question) => (
                  <TouchableOpacity
                    key={question.id}
                    style={[styles.questionItem, question.selected && styles.questionSelected]}
                    onPress={() => toggleQuestion(question.id)}
                  >
                    <Text style={[styles.questionText, question.selected && styles.questionTextSelected]}>
                      {question.question}
                    </Text>
                  </TouchableOpacity>
                ))
            )}
          </ScrollView>

          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton, categories.indexOf(currentCategory || '') <= 0 && styles.navButtonDisabled]}
              onPress={goToPreviousCategory}
              disabled={categories.indexOf(currentCategory || '') <= 0}
            >
              <Text style={[
                styles.navButtonText, 
                styles.prevButtonText,
                categories.indexOf(currentCategory || '') <= 0 && styles.navButtonTextDisabled
              ]}>
                Précédent
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={goToNextCategory}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.navButtonText}>
                  {categories.indexOf(currentCategory || '') < categories.length - 1
                    ? 'Suivant'
                    : 'Analyser mes résultats'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
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
    color: '#6b7280',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  actionButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeButton: {
    backgroundColor: '#e0e7ff',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  activeButtonText: {
    color: '#4f46e5',
    fontWeight: 'bold',
  },
  questionsContainer: {
    flex: 1,
    padding: 16,
  },
  questionItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#e5e7eb',
  },
  questionSelected: {
    borderLeftColor: '#4f46e5',
    backgroundColor: '#e0e7ff',
  },
  questionText: {
    fontSize: 16,
    color: '#4b5563',
  },
  questionTextSelected: {
    color: '#4f46e5',
    fontWeight: '500',
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  historyItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#4f46e5',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  scoreBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '600',
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  publicNotice: {
    backgroundColor: '#fef3c7',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  publicNoticeText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
  },
  noQuestionsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noQuestionsText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Styles pour les catégories
  progressContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4f46e5',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  categoryHeader: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  navButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  prevButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  nextButton: {
    backgroundColor: '#4f46e5',
  },
  navButtonDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  prevButtonText: {
    color: '#374151',
  },
  navButtonTextDisabled: {
    color: '#9ca3af',
  },
});

export default DiagnosticScreen; 