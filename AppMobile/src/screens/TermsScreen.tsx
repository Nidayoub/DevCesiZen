import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../constants/colors';

type TermsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Terms'>;

interface TermsScreenProps {
  navigation: TermsScreenNavigationProp;
}

const TermsScreen: React.FC<TermsScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conditions Générales</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.title}>Conditions Générales d'Utilisation</Text>
          <Text style={styles.subtitle}>CESIZen - Application de gestion du bien-être</Text>
          
          <Text style={styles.sectionTitle}>1. Objet</Text>
          <Text style={styles.paragraph}>
            Les présentes conditions générales d'utilisation (CGU) ont pour objet de définir les modalités et conditions d'utilisation de l'application mobile CESIZen, ainsi que les droits et obligations des parties dans ce cadre.
          </Text>
          
          <Text style={styles.sectionTitle}>2. Acceptation des conditions</Text>
          <Text style={styles.paragraph}>
            L'utilisation de l'application CESIZen implique l'acceptation pleine et entière des présentes CGU. Ces conditions s'appliquent à tous les utilisateurs de l'application.
          </Text>
          
          <Text style={styles.sectionTitle}>3. Description du service</Text>
          <Text style={styles.paragraph}>
            CESIZen est une application mobile dédiée à la gestion du stress et au bien-être mental. Elle propose :
          </Text>
          <Text style={styles.bullet}>• Des diagnostics de niveau de stress</Text>
          <Text style={styles.bullet}>• Des ressources et conseils personnalisés</Text>
          <Text style={styles.bullet}>• Un suivi de votre progression</Text>
          <Text style={styles.bullet}>• Des outils de gestion émotionnelle</Text>
          
          <Text style={styles.sectionTitle}>4. Inscription et compte utilisateur</Text>
          <Text style={styles.paragraph}>
            L'accès aux fonctionnalités complètes de l'application nécessite la création d'un compte utilisateur. Vous vous engagez à fournir des informations exactes et à maintenir la confidentialité de vos identifiants.
          </Text>
          
          <Text style={styles.sectionTitle}>5. Utilisation de l'application</Text>
          <Text style={styles.paragraph}>
            Vous vous engagez à utiliser l'application de manière responsable et conformément à sa finalité. Il est interdit de :
          </Text>
          <Text style={styles.bullet}>• Utiliser l'application à des fins illégales</Text>
          <Text style={styles.bullet}>• Tenter de contourner les mesures de sécurité</Text>
          <Text style={styles.bullet}>• Partager des contenus inappropriés</Text>
          <Text style={styles.bullet}>• Porter atteinte aux droits d'autres utilisateurs</Text>
          
          <Text style={styles.sectionTitle}>6. Données personnelles</Text>
          <Text style={styles.paragraph}>
            Le traitement de vos données personnelles est régi par notre Politique de Confidentialité, accessible depuis votre profil utilisateur.
          </Text>
          
          <Text style={styles.sectionTitle}>7. Propriété intellectuelle</Text>
          <Text style={styles.paragraph}>
            L'application CESIZen et tous ses éléments sont protégés par les droits de propriété intellectuelle. Toute reproduction non autorisée est interdite.
          </Text>
          
          <Text style={styles.sectionTitle}>8. Limitation de responsabilité</Text>
          <Text style={styles.paragraph}>
            L'application CESIZen est fournie à titre informatif et ne remplace pas un avis médical professionnel. En cas de détresse psychologique, consultez un professionnel de santé.
          </Text>
          
          <Text style={styles.sectionTitle}>9. Modification des CGU</Text>
          <Text style={styles.paragraph}>
            Nous nous réservons le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications importantes.
          </Text>
          
          <Text style={styles.sectionTitle}>10. Contact</Text>
          <Text style={styles.paragraph}>
            Pour toute question concernant ces conditions d'utilisation, vous pouvez nous contacter via l'application.
          </Text>
          
          <Text style={styles.footer}>
            Date de dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 44,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
    textAlign: 'justify',
  },
  bullet: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
    marginLeft: 16,
  },
  footer: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
});

export default TermsScreen; 