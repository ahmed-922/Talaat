import React, { useState } from 'react';
import { Button, Image, View, StyleSheet, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export interface Asset {
  uri: string;
  type: 'image' | 'video';
}

interface ImagePickerExampleProps {
  onAssetPicked: (asset: Asset) => void;
}

export default function ImagePickerExample({ onAssetPicked }: ImagePickerExampleProps) {
  const [asset, setAsset] = useState<Asset | null>(null);

  const pickAsset = async () => {
    // Request permission to access media
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("You've refused to allow this app to access your media!");
      return;
    }

    // Launch the media library picker (accepts both images and videos)
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    // If user did not cancel, process the first asset
    if (!result.canceled) {
      const pickedAsset = result.assets[0];
      // Try to use the provided type; if missing, infer from file extension
      const assetType =
        pickedAsset.type ||
        (pickedAsset.uri.match(/\.(mp4|mov)$/i) ? 'video' : 'image');

      const newAsset: Asset = { uri: pickedAsset.uri, type: assetType as 'image' | 'video' };
      setAsset(newAsset);
      onAssetPicked(newAsset);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title="Pick an image or video from camera roll"
        onPress={pickAsset}
      />
      {asset && asset.type === 'image' && (
        <Image source={{ uri: asset.uri }} style={styles.image} />
      )}
      {asset && asset.type === 'video' && (
        <Text style={styles.videoText}>Video Selected</Text>
      )}
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
  videoText: {
    marginTop: 10,
    fontSize: 16,
  },
});
