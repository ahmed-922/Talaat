import React, { useState } from 'react';
import { Button, Image, View, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface ImagePickerExampleProps {
  onImagePicked: (uri: string) => void;
}

export default function ImagePickerExample({ onImagePicked }: ImagePickerExampleProps) {
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    // Request permission to access images
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("You've refused to allow this app to access your photos!");
      return;
    }

    // Launch the image library picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    // result.canceled = true if the user dismissed without picking
    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setImage(imageUri);
      // Pass the picked image URI to the parent
      onImagePicked(imageUri);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Pick an image from camera roll" onPress={pickImage} />
      {image && <Image source={{ uri: image }} style={styles.image} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    marginTop: 10,
    width: 200,
    height: 200,
    resizeMode: 'cover',
    borderRadius: 10,
  },
});
