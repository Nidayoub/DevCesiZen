import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import COLORS from '../constants/colors';

interface SimpleMediaPickerProps {
  onFileSelected: (file: any) => void;
  onUploadComplete: (media: any) => void;
}

const SimpleMediaPicker: React.FC<SimpleMediaPickerProps> = ({ 
  onFileSelected, 
  onUploadComplete 
}) => {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const handleSelectMedia = () => {
    Alert.alert(
      'Sélectionner un média',
      'Choisissez une option',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Galerie', onPress: () => openImageLibrary() },
        { text: 'Caméra', onPress: () => openCamera() },
      ]
    );
  };

  const openImageLibrary = async () => {
    // Demander les permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de la permission pour accéder à la galerie');
      return;
    }

    // Lancer la galerie
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    handleImageResult(result);
  };

  const openCamera = async () => {
    // Demander les permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de la permission pour accéder à la caméra');
      return;
    }

    // Lancer la caméra
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    handleImageResult(result);
  };

  const handleImageResult = (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      // Créer l'objet file compatible avec FormData
      const file = {
        uri: asset.uri,
        type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
        name: `media_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
      };
      
      setSelectedFile(file);
      onFileSelected(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      setUploading(true);
      
      // Simuler un upload réussi pour l'instant
      const mockUpload = {
        type: selectedFile.type?.includes('video') ? 'video' : 'image',
        url: selectedFile.uri,
        filename: selectedFile.name
      };
      
      console.log('🎯 Media upload data:', mockUpload);
      onUploadComplete(mockUpload);
      Alert.alert('Succès', 'Média sélectionné avec succès!');
    } catch (error) {
      console.error('Erreur upload média:', error);
      Alert.alert('Erreur', 'Impossible d\'uploader le média');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Média (image ou vidéo)</Text>
      
      <TouchableOpacity
        style={styles.selectButton}
        onPress={handleSelectMedia}
      >
        <Text style={styles.selectButtonText}>
          {selectedFile ? 'Changer le média' : 'Sélectionner un média'}
        </Text>
      </TouchableOpacity>

      {selectedFile && (
        <View style={styles.previewContainer}>
          {selectedFile.type?.includes('image') && (
            <Image
              source={{ uri: selectedFile.uri }}
              style={styles.preview}
              resizeMode="cover"
            />
          )}
          
          <Text style={styles.fileName}>
            Fichier: {selectedFile.name}
          </Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={handleUpload}
              disabled={uploading}
            >
              <Text style={styles.uploadButtonText}>
                {uploading ? 'Upload...' : 'Confirmer'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => {
                setSelectedFile(null);
                onFileSelected(null);
              }}
            >
              <Text style={styles.removeButtonText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  previewContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileName: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
  },
  uploadButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  removeButton: {
    backgroundColor: '#ef4444',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SimpleMediaPicker; 