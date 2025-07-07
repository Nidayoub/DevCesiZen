import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Modal,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reportsApi } from '../services/api.service';

interface ReportButtonProps {
  contentType: 'comment' | 'resource';
  contentId: number;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam ou contenu répétitif' },
  { value: 'harassment', label: 'Harcèlement ou intimidation' },
  { value: 'hate_speech', label: 'Discours de haine' },
  { value: 'misinformation', label: 'Désinformation' },
  { value: 'inappropriate', label: 'Contenu inapproprié' },
  { value: 'copyright', label: 'Violation de droits d\'auteur' },
  { value: 'other', label: 'Autre' }
];

const ReportButton: React.FC<ReportButtonProps> = ({
  contentType,
  contentId,
  size = 'medium',
  style
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkReportStatus();
  }, [contentType, contentId]);

  const checkReportStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await reportsApi.checkReported(contentType, contentId);
      setIsReported(response?.data?.isReported || false);
    } catch (error) {
      console.error('Erreur lors de la vérification du statut de signalement:', error);
      setIsReported(false);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleReport = async () => {
    if (!selectedReason) {
      Alert.alert('Erreur', 'Veuillez sélectionner une raison pour le signalement.');
      return;
    }

    try {
      setSubmitting(true);
      await reportsApi.create(contentType, contentId, selectedReason, description);
      
      setIsReported(true);
      setModalVisible(false);
      setSelectedReason('');
      setDescription('');
      
      Alert.alert(
        'Signalement envoyé',
        'Merci pour votre signalement. Notre équipe de modération l\'examinera dans les plus brefs délais.'
      );
    } catch (error: any) {
      console.error('Erreur lors du signalement:', error);
      const errorMessage = error.response?.data?.message || 'Une erreur est survenue lors du signalement.';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 14;
      case 'large': return 20;
      default: return 16;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small': return 12;
      case 'large': return 16;
      default: return 14;
    }
  };

  if (checkingStatus) {
    return (
      <TouchableOpacity 
        style={[styles.button, style]} 
        disabled
      >
        <ActivityIndicator size="small" color="#9ca3af" />
      </TouchableOpacity>
    );
  }

  if (isReported) {
    return (
      <TouchableOpacity 
        style={[styles.button, styles.reportedButton, style]} 
        disabled
      >
        <Ionicons name="flag" size={getIconSize()} color="#ef4444" />
        <Text style={[styles.buttonText, styles.reportedText, { fontSize: getTextSize() }]}>
          Signalé
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity 
        style={[styles.button, style]} 
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="flag-outline" size={getIconSize()} color="#6b7280" />
        <Text style={[styles.buttonText, { fontSize: getTextSize() }]}>
          Signaler
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Signaler ce {contentType === 'comment' ? 'commentaire' : 'contenu'}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.sectionTitle}>
                Pourquoi signalez-vous ce {contentType === 'comment' ? 'commentaire' : 'contenu'} ?
              </Text>

              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.value}
                  style={[
                    styles.reasonOption,
                    selectedReason === reason.value && styles.selectedReason
                  ]}
                  onPress={() => setSelectedReason(reason.value)}
                >
                  <View style={[
                    styles.radioButton,
                    selectedReason === reason.value && styles.radioButtonSelected
                  ]}>
                    {selectedReason === reason.value && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <Text style={styles.reasonText}>{reason.label}</Text>
                </TouchableOpacity>
              ))}

              <Text style={styles.sectionTitle}>
                Description supplémentaire (optionnelle)
              </Text>
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Décrivez le problème en détail..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  (!selectedReason || submitting) && styles.submitButtonDisabled
                ]}
                onPress={handleReport}
                disabled={!selectedReason || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>Signaler</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  buttonText: {
    marginLeft: 4,
    color: '#6b7280',
  },
  reportedButton: {
    opacity: 0.6,
  },
  reportedText: {
    color: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedReason: {
    backgroundColor: '#eff6ff',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonSelected: {
    borderColor: '#4f46e5',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4f46e5',
  },
  reasonText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    height: 100,
    backgroundColor: '#f9fafb',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    minWidth: 80,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default ReportButton; 