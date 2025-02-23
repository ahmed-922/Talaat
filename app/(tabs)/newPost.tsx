import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  Button,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../../firebaseConfig'; // adjust path as needed

// Define an interface for the asset (image or video)
interface Asset {
  uri: string;
  type: 'image' | 'video';
}

export default function NewPostScreen() {
  const router = useRouter();
  const [caption, setCaption] = useState('');
  const [extraText, setExtraText] = useState('');
  // Now store the picked asset (which may be an image or a video)
  const [asset, setAsset] = useState<Asset | null>(null);
  const currentUser = auth.currentUser;

  const pickAsset = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, // Accept both images and videos
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const pickedAsset = result.assets[0];
      // Determine asset type (fallback to checking file extension if not provided)
      const assetType =
        pickedAsset.type ||
        (pickedAsset.uri.match(/\.(mp4|mov)$/i) ? 'video' : 'image');
      setAsset({ uri: pickedAsset.uri, type: assetType as 'image' | 'video' });
    }
  };

  const handlePost = async () => {
    // Validate that at least one of the text inputs is non-empty
    if (!caption.trim() && !extraText.trim()) {
      Alert.alert('Error', 'Please add either a caption or extra text before posting.');
      return;
    }

    try {
      let downloadURL = '';

      if (asset) {
        const response = await fetch(asset.uri);
        const blob = await response.blob();

        // Choose the storage path based on asset type
        const storagePath =
          asset.type === 'video'
            ? `videos/${Date.now()}.mp4`
            : `photos/${Date.now()}.jpg`;
        const storageRef = ref(storage, storagePath);

        await uploadBytes(storageRef, blob);
        downloadURL = await getDownloadURL(storageRef);
      }

      // Choose the Firestore collection based on asset type:
      // If asset is a video, add to 'videos' collection; otherwise, 'posts'
      const collectionName =
        asset && asset.type === 'video' ? 'videos' : 'posts';

      const postData = {
        byUser: currentUser?.uid || 'anonymous',
        caption,
        extraText,
        likes: [],
        createdAt: new Date(),
      };

      // Save the URL under a specific key based on asset type
      if (asset) {
        if (asset.type === 'video') {
          postData.mediaUrl = downloadURL;
          postData.mediaType = 'video';
        } else {
          postData.img = downloadURL;
        }
      }

      await addDoc(collection(db, collectionName), postData);

      // Reset fields
      setCaption('');
      setExtraText('');
      setAsset(null);

      Alert.alert('Post Created', 'Your post has been successfully created.', [
        {
          text: 'OK',
          onPress: () => {
            router.push('/');
          },
        },
      ]);
    } catch (error) {
      console.error('Error adding post:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.userRow}>
          <Image
            source={{ uri: 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
        </View>

        {/* Render a preview if the asset is an image */}
        {asset && asset.type === 'image' && (
          <Image source={{ uri: asset.uri }} style={styles.previewImage} />
        )}
        {/* For video, you might later add a video preview component */}
        {asset && asset.type === 'video' && (
          <Text style={styles.videoInfo}>Video Selected</Text>
        )}

        <TouchableOpacity onPress={pickAsset}>
          <Text style={styles.addImageText}>Add image or video</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.inputCaption}
          placeholder="What's new?"
          placeholderTextColor="#888"
          value={caption}
          onChangeText={setCaption}
          maxLength={20}
        />

        {/* Extra Text Input */}
        <TextInput
          style={styles.inputExtra}
          placeholder="Say more..."
          placeholderTextColor="#888"
          multiline
          value={extraText}
          onChangeText={setExtraText}
        />

        <Text style={styles.replyInfo}>Anyone can reply & quote</Text>
        <View style={styles.postButtonRow}>
          <Button title="Post" onPress={handlePost} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    borderRadius: 8,
    marginBottom: 16,
  },
  videoInfo: {
    fontSize: 16,
    marginBottom: 16,
    color: '#555',
  },
  addImageText: {
    color: '#007AFF',
    marginBottom: 16,
  },
  inputCaption: {
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    color: 'black',
    paddingVertical: 4,
    marginBottom: 16,
  },
  inputExtra: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    color: 'black',
    padding: 8,
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 16,
  },
  replyInfo: {
    color: '#888',
    marginTop: 8,
  },
  postButtonRow: {
    padding: 16,
    alignItems: 'flex-end',
  },
});
