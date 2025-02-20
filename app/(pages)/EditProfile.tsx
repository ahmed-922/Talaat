import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  useColorScheme,
  Alert,
} from 'react-native';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Upload from '../../components/upload';
// Import storage methods from Firebase Storage
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function EditProfile() {
  const [user, setUser] = useState<any>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  // This will now store the download URL from Firebase Storage
  const [profilePicture, setProfilePicture] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserProfile(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch the user doc by matching the "uid" field
  const fetchUserProfile = async (uid: string) => {
    const userDocs = await getDocs(
      query(collection(db, 'users'), where('uid', '==', uid))
    );

    if (!userDocs.empty) {
      // Grab the first matching doc
      const docSnap = userDocs.docs[0];
      setDocId(docSnap.id); // Store the actual Firestore doc ID
      const userData = docSnap.data();

      setName(userData.username ?? '');
      setBio(userData.bio ?? '');
      setProfilePicture(userData.profilePicture ?? '');
    }
  };

  // Function to handle image upload to Firebase Storage
  const handleImageUpload = async (uri: string) => {
    try {
      // Convert image URI to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Create a reference in Firebase Storage using the user's UID
      const storage = getStorage();
      const storageRef = ref(storage, `profilePictures/${user.uid}.jpg`);

      // Upload the file
      await uploadBytes(storageRef, blob);

      // Retrieve the download URL
      const downloadUrl = await getDownloadURL(storageRef);
      // Update state with the Firebase Storage URL
      setProfilePicture(downloadUrl);
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      if (!docId) {
        Alert.alert('Error', 'No matching user document found.');
        return;
      }

      // Use the doc ID to update Firestore with the download URL of the image
      const userRef = doc(db, 'users', docId);
      await updateDoc(userRef, {
        username: name,
        bio: bio,
        profilePicture: profilePicture,
      });

      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => router.push('../(tabs)/user'),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  return (
    <View
      style={[
        styles.container,
        colorScheme === 'light' ? styles.lightContainer : styles.darkContainer,
      ]}
    >
      <Text style={styles.label}>Edit Profile</Text>

      <View style={styles.imageContainer}>
        <TouchableOpacity onPress={() => setShowUpload(true)}>
          {profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.profileImage} />
          ) : (
            <Ionicons
              name="person-circle-outline"
              size={100}
              color={colorScheme === 'light' ? '#242c40' : '#E6E8E9'}
            />
          )}
          <View style={styles.plusIcon}>
            <Ionicons name="add-circle" size={24} color="#007AFF" />
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.fieldLabel}>Username</Text>
      <TextInput
        style={[
          styles.input,
          colorScheme === 'light' ? styles.lightInput : styles.darkInput,
        ]}
        value={name}
        onChangeText={setName}
        placeholder="Enter username"
        placeholderTextColor={colorScheme === 'light' ? '#242c40' : '#d0d0c0'}
      />

      <Text style={styles.fieldLabel}>Bio</Text>
      <TextInput
        style={[
          styles.input,
          colorScheme === 'light' ? styles.lightInput : styles.darkInput,
        ]}
        value={bio}
        onChangeText={setBio}
        placeholder="Enter bio"
        placeholderTextColor={colorScheme === 'light' ? '#242c40' : '#d0d0c0'}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>

      {/* Modal for Upload.tsx */}
      <Modal visible={showUpload} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Upload
              onImagePicked={async (uri) => {
                await handleImageUpload(uri);
                setShowUpload(false);
              }}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowUpload(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  lightContainer: {
    backgroundColor: '#d0d0c0',
  },
  darkContainer: {
    backgroundColor: '#0A0A0A',
  },
  label: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  imageContainer: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  plusIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  fieldLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  lightInput: {
    color: '#242c40',
    backgroundColor: '#fff',
  },
  darkInput: {
    color: '#E6E8E9',
    backgroundColor: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
});
