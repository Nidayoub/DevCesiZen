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

type PrivacyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Privacy'>;

interface PrivacyScreenProps {
  navigation: PrivacyScreenNavigationProp;
}

const PrivacyScreen: React.FC<PrivacyScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Politique de Confidentialité</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.title}>Politique de Confidentialité</Text>
          <Text style={styles.subtitle}>CESIZen - Protection de vos données personnelles</Text>
          
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.paragraph}>
            Nous attachons une grande importance à la protection de vos données personnelles. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations lors de l'utilisation de l'application CESIZen.
          </Text>
          
          <Text style={styles.sectionTitle}>2. Données collectées</Text>
          <Text style={styles.paragraph}>Nous collectons les types de données suivantes :</Text>
          <Text style={styles.bullet}>• Informations d'identification (nom, prénom, email)</Text>
          <Text style={styles.bullet}>• Données de diagnostic de stress</Text>
          <Text style={styles.bullet}>• Préférences et paramètres d'utilisation</Text>
          <Text style={styles.bullet}>• Données d'utilisation de l'application</Text>
          <Text style={styles.bullet}>• Commentaires et interactions</Text>
          
          <Text style={styles.sectionTitle}>3. Finalités du traitement</Text>
          <Text style={styles.paragraph}>Vos données sont utilisées pour :</Text>
          <Text style={styles.bullet}>• Fournir les services de l'application</Text>
          <Text style={styles.bullet}>• Personnaliser votre expérience</Text>
          <Text style={styles.bullet}>• Améliorer nos services</Text>
          <Text style={styles.bullet}>• Assurer la sécurité de la plateforme</Text>
          <Text style={styles.bullet}>• Respecter nos obligations légales</Text>
          
          <Text style={styles.sectionTitle}>4. Base légale du traitement</Text>
          <Text style={styles.paragraph}>
            Le traitement de vos données repose sur votre consentement, l'exécution du contrat de service, et nos intérêts légitimes pour améliorer l'application.
          </Text>
          
          <Text style={styles.sectionTitle}>5. Partage des données</Text>
          <Text style={styles.paragraph}>
            Nous ne vendons pas vos données personnelles. Elles peuvent être partagées uniquement dans les cas suivants :
          </Text>
          <Text style={styles.bullet}>• Avec votre consentement explicite</Text>
          <Text style={styles.bullet}>• Pour respecter une obligation légale</Text>
          <Text style={styles.bullet}>• Avec nos prestataires de services (sous contrat strict)</Text>
          
          <Text style={styles.sectionTitle}>6. Sécurité des données</Text>
          <Text style={styles.paragraph}>
            Nous mettons en place des mesures techniques et organisationnelles appropriées pour protéger vos données contre l'accès non autorisé, la modification, la divulgation ou la destruction.
          </Text>
          
          <Text style={styles.sectionTitle}>7. Conservation des données</Text>
          <Text style={styles.paragraph}>
            Vos données sont conservées aussi longtemps que nécessaire pour fournir nos services et respecter nos obligations légales. Vous pouvez demander la suppression de votre compte à tout moment.
          </Text>
          
          <Text style={styles.sectionTitle}>8. Vos droits</Text>
          <Text style={styles.paragraph}>Conformément au RGPD, vous disposez des droits suivants :</Text>
          <Text style={styles.bullet}>• Droit d'accès à vos données</Text>
          <Text style={styles.bullet}>• Droit de rectification</Text>
          <Text style={styles.bullet}>• Droit à l'effacement</Text>
          <Text style={styles.bullet}>• Droit à la portabilité</Text>
          <Text style={styles.bullet}>• Droit d'opposition</Text>
          <Text style={styles.bullet}>• Droit de limitation du traitement</Text>
          
          <Text style={styles.sectionTitle}>9. Cookies et technologies similaires</Text>
          <Text style={styles.paragraph}>
            L'application peut utiliser des technologies de stockage local pour améliorer votre expérience et assurer le bon fonctionnement des services.
          </Text>
          
          <Text style={styles.sectionTitle}>10. Transferts internationaux</Text>
          <Text style={styles.paragraph}>
            Si vos données sont transférées hors de l'Union européenne, nous nous assurons qu'elles bénéficient d'un niveau de protection adéquat.
          </Text>
          
          <Text style={styles.sectionTitle}>11. Modifications de la politique</Text>
          <Text style={styles.paragraph}>
            Cette politique peut être mise à jour occasionnellement. Nous vous informerons des modifications importantes par notification dans l'application.
          </Text>
          
          <Text style={styles.sectionTitle}>12. Contact</Text>
          <Text style={styles.paragraph}>
            Pour exercer vos droits ou pour toute question concernant cette politique de confidentialité, vous pouvez nous contacter via l'application.
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

export default PrivacyScreen; 