import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import COLORS from '../constants/colors';

interface SimpleMediaPickerProps {
  onFileSelected: (file: any) => void;
  onUploadComplete: (media: any) => void;
}

const SimpleMediaPicker: React.FC<SimpleMediaPickerProps> = ({ 
  onFileSelected, 
  onUploadComplete 
}) => {
  const [mediaUpload, setMediaUpload] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

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
      quality: 0.9, // Qualité haute pour manipulation ultérieure
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
      quality: 0.9, // Qualité haute pour manipulation ultérieure
    });

    handleImageResult(result);
  };

  const handleImageResult = async (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      // Créer l'objet file compatible avec FormData
      const file = {
        uri: asset.uri,
        type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
        name: `media_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
      };
      
      // Traitement automatique immédiat
      await processMediaAutomatically(file);
    }
  };

  const compressImage = async (uri: string): Promise<string> => {
    try {
      console.log('🔧 Compression intelligente de l\'image...');
      
      // Paramètres optimisés pour mobile et base64
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [
          // Redimensionner intelligemment :
          // - Max 1200px pour bonne qualité
          // - Garde les proportions
          { resize: { width: 1200 } }
        ],
        {
          compress: 0.8, // 80% de qualité - bon compromis taille/qualité
          format: ImageManipulator.SaveFormat.JPEG, // JPEG plus efficient que PNG
          base64: true, // Retourne directement en base64
        }
      );
      
      const dataUrl = `data:image/jpeg;base64,${manipulatedImage.base64}`;
      
      // Log des infos de compression
      const originalSizeKB = Math.round(uri.length / 1024);
      const compressedSizeKB = Math.round(dataUrl.length / 1024);
      const reductionPercent = Math.round(((originalSizeKB - compressedSizeKB) / originalSizeKB) * 100);
      
      console.log(`✅ Compression réussie: ${originalSizeKB}KB → ${compressedSizeKB}KB (${reductionPercent}% de réduction)`);
      
      return dataUrl;
      
    } catch (error) {
      console.error('Erreur compression image:', error);
      throw error;
    }
  };

  const processMediaAutomatically = async (file: any) => {
    try {
      setProcessing(true);
      onFileSelected(file);
      
      let finalContent: string;
      let finalType: string;
      
      if (file.type?.includes('image')) {
        // Compression pour les images
        console.log('📸 Traitement et compression de l\'image...');
        finalContent = await compressImage(file.uri);
        finalType = 'image';
      } else {
        // Pas de compression pour les vidéos (pas supportée par ImageManipulator)
        console.log('🎬 Traitement de la vidéo (sans compression)...');
        const response = await fetch(file.uri);
        const blob = await response.blob();
        
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
        
        finalContent = base64;
        finalType = 'video';
      }
      
      const mediaUploadData = {
        type: finalType,
        content: finalContent,
        filename: file.name
      };
      
      console.log('✅ Média traité avec succès:', { 
        ...mediaUploadData, 
        content: 'BASE64_DATA_TRUNCATED',
        compressedSize: Math.round(finalContent.length / 1024) + ' KB'
      });
      
      setMediaUpload(mediaUploadData);
      onUploadComplete(mediaUploadData);
      setProcessing(false);
      
    } catch (error) {
      console.error('Erreur traitement média:', error);
      Alert.alert('Erreur', 'Impossible de traiter le média');
      setProcessing(false);
    }
  };



  return (
    <View style={styles.container}>
      <Text style={styles.label}>Média (image ou vidéo)</Text>
      
      {!mediaUpload && !processing && (
        <TouchableOpacity
          style={styles.selectButton}
          onPress={handleSelectMedia}
        >
          <Text style={styles.selectButtonText}>
            Sélectionner un média
          </Text>
        </TouchableOpacity>
      )}

      {processing && (
        <View style={styles.processingContainer}>
          <Text style={styles.processingText}>🔧 Optimisation de votre média...</Text>
          <Text style={styles.processingSubtext}>Compression et conversion en cours</Text>
        </View>
      )}

      {mediaUpload && !processing && (
        <View style={styles.previewContainer}>
          {mediaUpload.type === 'image' && (
            <Image
              source={{ uri: mediaUpload.content }}
              style={styles.preview}
              resizeMode="cover"
            />
          )}
          
          <Text style={styles.fileName}>
            ✅ Média ajouté: {mediaUpload.filename}
          </Text>
          
          {mediaUpload.type === 'image' && (
            <View style={styles.optimizationBadge}>
              <Text style={styles.optimizationText}>🔧 Optimisé pour mobile</Text>
            </View>
          )}
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.changeButton}
              onPress={handleSelectMedia}
            >
              <Text style={styles.changeButtonText}>Changer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => {
                setMediaUpload(null);
                onFileSelected(null);
                onUploadComplete(null);
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
  optimizationBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  optimizationText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  processingContainer: {
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0277bd',
    marginBottom: 4,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#0288d1',
  },
  changeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
  },
  changeButtonText: {
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