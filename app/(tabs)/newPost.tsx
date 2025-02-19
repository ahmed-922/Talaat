// newPost.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  ImageBackground,
  useColorScheme
} from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../../firebaseConfig'; // Note: import auth as well
import Upload from '../../components/upload';

// Helper function to convert local file URI into a blob (via XMLHttpRequest)
async function uploadImageAsync(uri: string): Promise<string> {
  const blob: Blob = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function (e) {
      console.error(e);
      reject(new TypeError('Network request failed'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });

  // Create a reference in Firebase Storage (under a folder "photos")
  const fileName = Date.now().toString();
  const fileRef = ref(storage, `photos/${fileName}.jpg`);

  // Upload the blob to Firebase Storage
  await uploadBytes(fileRef, blob);
  (blob as any).close?.(); // Release the blob if supported

  // Retrieve and return the download URL for the uploaded image
  const downloadURL = await getDownloadURL(fileRef);
  return downloadURL;
}

export default function NewTask() {
  const [caption, setCaption] = useState('');
  const [img, setImage] = useState('');
  const colorScheme = useColorScheme();

  // Callback to get the selected image URI from the Upload component
  const handleImagePicked = (uri: string) => {
    setImage(uri);
  };

  const handleSubmit = async () => {
    try {
      if (!img) {
        console.log('No image selected');
        return;
      }
  
      // 1. Upload image to Firebase Storage and get download URL
      const downloadURL = await uploadImageAsync(img);
  
      // 2. Get the current logged in user's details from Firebase Auth
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No user logged in');
        return;
      }
      const userId = currentUser.uid;
      const username = currentUser.displayName || 'Anonymous'; // Use displayName or a fallback
  
      // 3. Save the post to Firestore with caption, image URL, user id, and username
      await addDoc(collection(db, 'posts'), {
        caption,
        img: downloadURL,
        byUser: userId,
        username, // store the username
        createdAt: new Date()
      });
  
      console.log('Post added successfully!');
      // Optionally clear the inputs
      setCaption('');
      setImage('');
    } catch (e) {
      console.error('Error adding post:', e);
    }
  };
  
  const themeCardStyle = colorScheme === 'light' ? styles.lightCard : styles.darkCard;
  const themeTextStyle = colorScheme === 'light' ? styles.lightThemeText : styles.darkThemeText;

  return (
    <ImageBackground
      source={{
        uri: 'https://letsenhance.io/static/8f5e523ee6b2479e26ecc91b9c25261e/1015f/MainAfter.jpg'
      }}
      style={styles.background}
    >
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={[styles.card, themeCardStyle]}>
            <Text style={[styles.header, themeTextStyle]}>
              Your post
            </Text>
            <Text style={[styles.label, themeTextStyle]}>
              Give a brief caption about your task
            </Text>
            <TextInput
              style={[styles.input, themeTextStyle]}
              value={caption}
              onChangeText={setCaption}
              placeholder="Enter task caption"
              placeholderTextColor={colorScheme === 'light' ? '#242c40' : '#d0d0c0'}
            />
            <View>
              <Upload onImagePicked={handleImagePicked} />
              <Button title="Submit" onPress={handleSubmit} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  background: {
    flex: 1,
    resizeMode: 'cover'
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  card: {
    borderRadius: 10,
    padding: 20,
    width: '100%',
    height: '90%',
    marginTop: 350,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5
  },
  lightCard: {
    backgroundColor: '#fff',
    shadowColor: '#aaa'
  },
  darkCard: {
    backgroundColor: '#181818',
    shadowColor: '#000'
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center'
  },
  label: {
    marginVertical: 10,
    fontSize: 16
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    width: '100%',
    borderColor: '#ccc'
  },
  lightThemeText: {
    color: '#000'
  },
  darkThemeText: {
    color: '#fff'
  }
});
