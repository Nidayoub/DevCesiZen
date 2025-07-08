import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import COLORS from '../constants/colors';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const { width } = Dimensions.get('window');

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { isAuthenticated, user } = useAuth();

  const handlePrimaryAction = () => {
    if (isAuthenticated) {
      // Si l'utilisateur est connecté, naviguer vers le tableau de bord
      navigation.navigate('Dashboard');
    } else {
      navigation.navigate('Diagnostic');
    }
  };

  const handleSecondaryAction = () => {
    if (isAuthenticated) {
      navigation.navigate('Resources');
    } else {
      navigation.navigate('Resources');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>
            Retrouvez votre sérénité{'\n'}
            <Text style={styles.heroSubtitle}>avec CESIZen</Text>
          </Text>
          <Text style={styles.heroDescription}>
            Votre compagnon numérique pour la gestion du stress et l'amélioration du bien-être quotidien.
          </Text>
          
          <View style={styles.heroButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={handlePrimaryAction}>
              <Text style={styles.primaryButtonText}>
                {isAuthenticated ? 'Mon tableau de bord' : 'Évaluer mon stress'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={handleSecondaryAction}>
              <Text style={styles.secondaryButtonText}>
                Ressources
              </Text>
            </TouchableOpacity>
            
            {!isAuthenticated && (
              <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginButtonText}>
                  Se connecter
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Une approche complète du bien-être</Text>
        <Text style={styles.sectionDescription}>
          Découvrez les outils que CESIZen met à votre disposition pour vous aider à gérer votre stress.
        </Text>

        <View style={styles.featuresGrid}>
          {/* Feature 1 - Diagnostic */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => navigation.navigate('Diagnostic')}
          >
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>📊</Text>
            </View>
            <Text style={styles.featureTitle}>Diagnostic de Stress</Text>
            <Text style={styles.featureDescription}>
              Évaluez votre niveau de stress avec notre outil basé sur l'échelle de Holmes et Rahe.
            </Text>
          </TouchableOpacity>

          {/* Feature 2 - Resources */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => navigation.navigate('Resources')}
          >
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>📚</Text>
            </View>
            <Text style={styles.featureTitle}>Ressources et Activités</Text>
            <Text style={styles.featureDescription}>
              Accédez à une bibliothèque de ressources pour vous aider à gérer votre stress.
            </Text>
          </TouchableOpacity>          

          {/* Feature 4 - Suivi (nécessite connexion) */}
          <TouchableOpacity 
            style={[styles.featureCard, !isAuthenticated && styles.featureCardDisabled]}
            onPress={() => {
              if (isAuthenticated) {
                navigation.navigate('Dashboard');
              } else {
                navigation.navigate('Login');
              }
            }}
          >
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>📈</Text>
            </View>
            <Text style={styles.featureTitle}>Suivi Personnalisé</Text>
            <Text style={styles.featureDescription}>
              {isAuthenticated ? 
                'Suivez votre progression et obtenez des recommandations personnalisées.' :
                'Connectez-vous pour accéder au suivi personnalisé.'
              }
            </Text>
            {!isAuthenticated && (
              <View style={styles.lockOverlay}>
                <Text style={styles.lockText}>🔒</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>
          Prêt à améliorer votre bien-être ?
        </Text>
        <Text style={styles.ctaSubtitle}>Commencez dès aujourd'hui.</Text>
        
        <TouchableOpacity style={styles.ctaButton} onPress={handlePrimaryAction}>
          <Text style={styles.ctaButtonText}>
            {isAuthenticated ? 'Tableau de bord' : 'Commencer'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  heroSection: {
    backgroundColor: '#4f46e5',
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 20,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroSubtitle: {
    color: '#c7d2fe',
  },
  heroDescription: {
    fontSize: 16,
    color: '#c7d2fe',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  heroButtons: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#4f46e5',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#c7d2fe',
    fontSize: 14,
    fontWeight: '500',
  },
  featuresSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  featureCardDisabled: {
    opacity: 0.7,
  },
  featureIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#e0e7ff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  lockOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockText: {
    fontSize: 16,
  },
  ctaSection: {
    backgroundColor: '#e0e7ff',
    padding: 32,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 18,
    color: '#4f46e5',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen; 