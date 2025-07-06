import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../constants/colors';

type DiagnosticResultRouteProp = RouteProp<RootStackParamList, 'DiagnosticResult'>;
type DiagnosticResultNavigationProp = StackNavigationProp<RootStackParamList, 'DiagnosticResult'>;

interface DiagnosticResultScreenProps {
  route: DiagnosticResultRouteProp;
  navigation: DiagnosticResultNavigationProp;
}

const { width } = Dimensions.get('window');

const DiagnosticResultScreen: React.FC<DiagnosticResultScreenProps> = ({ route, navigation }) => {
  const { score, stressLevel, interpretation, selectedEventsCount } = route.params;

  const getScoreColor = () => {
    if (score < 150) return '#10b981'; // Vert
    if (score < 300) return '#f59e0b'; // Orange
    return '#ef4444'; // Rouge
  };

  const getScoreIcon = () => {
    if (score < 150) return 'checkmark-circle';
    if (score < 300) return 'warning';
    return 'alert-circle';
  };

  const getRecommendations = () => {
    if (score < 150) {
      return [
        'Maintenez vos habitudes saines actuelles',
        'Continuez à pratiquer des activités relaxantes',
        'Restez vigilant aux signes de stress',
        'Partagez vos bonnes pratiques avec votre entourage'
      ];
    } else if (score < 300) {
      return [
        'Pratiquez des techniques de relaxation quotidiennes',
        'Organisez mieux votre temps et vos priorités',
        'Parlez de vos préoccupations à un proche',
        'Considérez consulter un professionnel de santé',
        'Adoptez une routine d\'exercice régulière'
      ];
    } else {
      return [
        'Consultez un professionnel de santé dans les plus brefs délais',
        'Pratiquez des techniques de gestion du stress intensives',
        'Réorganisez vos priorités et réduisez les sources de stress',
        'Cherchez du soutien auprès de votre famille et amis',
        'Envisagez un accompagnement psychologique'
      ];
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header avec niveau */}
      <View style={[styles.scoreContainer, { backgroundColor: getScoreColor() }]}>
        <Ionicons name={getScoreIcon()} size={64} color="#ffffff" />
        <Text style={styles.levelText}>{stressLevel}</Text>
      </View>

      {/* Interprétation */}
      <View style={styles.interpretationContainer}>
        <Text style={styles.sectionTitle}>Interprétation</Text>
        <Text style={styles.interpretationText}>{interpretation}</Text>
      </View>

      {/* Statistiques */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Statistiques</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{selectedEventsCount}</Text>
            <Text style={styles.statLabel}>Événements sélectionnés</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: getScoreColor() }]}>
              {score < 150 ? 'Faible' : score < 300 ? 'Modéré' : 'Élevé'}
            </Text>
            <Text style={styles.statLabel}>Niveau de risque</Text>
          </View>
        </View>
      </View>

      {/* Recommandations */}
      <View style={styles.recommendationsContainer}>
        <Text style={styles.sectionTitle}>Recommandations</Text>
        <View style={styles.recommendationsList}>
          {getRecommendations().map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <View style={[styles.recommendationBullet, { backgroundColor: getScoreColor() }]} />
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Resources')}
        >
          <Ionicons name="library" size={20} color="#ffffff" />
          <Text style={styles.primaryButtonText}>Explorer les ressources</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Diagnostic')}
        >
          <Ionicons name="refresh" size={20} color="#4f46e5" />
          <Text style={styles.secondaryButtonText}>Refaire un diagnostic</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tertiaryButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.tertiaryButtonText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.disclaimer}>
        <Ionicons name="information-circle" size={16} color="#9ca3af" />
        <Text style={styles.disclaimerText}>
          Ce diagnostic est basé sur l'échelle de Holmes et Rahe. Il s'agit d'un outil indicatif qui ne remplace pas un avis médical professionnel.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  levelText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    textAlign: 'center',
  },
  interpretationContainer: {
    margin: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  interpretationText: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  statsContainer: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    maxWidth: '45%',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  recommendationsContainer: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationsList: {
    gap: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  recommendationBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  actionsContainer: {
    margin: 16,
    marginTop: 0,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4f46e5',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#4f46e5',
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryButton: {
    alignItems: 'center',
    padding: 12,
  },
  tertiaryButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
});

export default DiagnosticResultScreen; 