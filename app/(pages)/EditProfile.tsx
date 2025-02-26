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
  getDoc,
} from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Upload from '../../components/upload';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function EditProfile() {
  const [user, setUser] = useState<any>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
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

  const fetchUserProfile = async (uid: string) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        setDocId(uid);
        const userData = userDoc.data();
        setName(userData.username ?? '');
        setBio(userData.bio ?? '');
        setProfilePicture(userData.profilePicture ?? '');
      } else {
        const userDocs = await getDocs(
          query(collection(db, 'users'), where('uid', '==', uid))
        );
        if (!userDocs.empty) {
          const docSnap = userDocs.docs[0];
          setDocId(docSnap.id);
          const userData = docSnap.data();
          setName(userData.username ?? '');
          setBio(userData.bio ?? '');
          setProfilePicture(userData.profilePicture ?? '');
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const handleImageUpload = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const storageRef = ref(storage, `profilePictures/${user.uid}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
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
