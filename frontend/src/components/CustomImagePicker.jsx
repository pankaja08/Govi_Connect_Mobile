import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const CustomImagePicker = ({ images, onImagesChange, maxImages = 5, showAddButton = true }) => {
  const pickImage = async () => {
    if (images.length >= maxImages) {
      Alert.alert('Limit Reached', `You can only upload up to ${maxImages} images.`);
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      onImagesChange([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollStyle}
      >
        {images.map((uri, index) => (
          <View key={index} style={styles.imageWrapper}>
            <View style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeImage(index)}
              >
                <View style={styles.deleteIconCircle}>
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {showAddButton && images.length < maxImages && (
          <TouchableOpacity style={styles.addButton} onPress={pickImage}>
            <View style={styles.addIconCircle}>
              <Ionicons name="image-outline" size={30} color="#2E7D32" />
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
      
      {images.length > 0 && (
        <View style={styles.previewLabelContainer}>
          <View style={styles.greenDot} />
          <Text style={styles.previewLabel}>IMAGE PREVIEW</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    alignItems: 'center',
  },
  scrollStyle: {
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    paddingVertical: 5,
  },
  imageWrapper: {
    marginHorizontal: 6,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#4CAF50',
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  deleteIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  previewLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    justifyContent: 'center',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#666',
    letterSpacing: 0.5,
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 10,
  },
  addIconCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomImagePicker;
