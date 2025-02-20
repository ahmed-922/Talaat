import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image, ScrollView, SafeAreaView, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../../firebaseConfig'; // adjust path as needed

export default function NewPostScreen() {
  const router = useRouter();
  const [caption, setCaption] = useState('');
  const [extraText, setExtraText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const currentUser = auth.currentUser;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    // Validate that at least one of the text inputs is non-empty
    if (!caption.trim() && !extraText.trim()) {
      Alert.alert("Error", "Please add either a caption or extra text before posting.");
      return;
    }

    try {
      let downloadURL = '';

      if (imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const storageRef = ref(storage, `photos/${Date.now()}.jpg`);
        await uploadBytes(storageRef, blob);
        downloadURL = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'posts'), {
        byUser: currentUser?.uid || 'anonymous',
        caption,
        extraText,
        img: downloadURL,
        likes: [],
        createdAt: new Date(),
      });

      // Reset fields
      setCaption('');
      setExtraText('');
      setImageUri(null);

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

        {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}

        <TouchableOpacity onPress={pickImage}>
          <Text style={styles.addImageText}>Add image</Text>
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
