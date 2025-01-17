import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, TouchableOpacity, FlatList } from 'react-native';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UserProfile() {
  const [user, setUser] = useState<User|null>(null);
  const [tasks, setTasks] = useState([]);
  const [name, setName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserProfile(currentUser.uid);
        fetchUserTasks(currentUser.uid);
      } else {
        router.push('./index');
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (uid) => {
    const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', uid)));
    if (!userDoc.empty) {
      const userData = userDoc.docs[0].data();
      setName(userData.username);
      setProfilePicture(userData.profilePicture);
    }
  };

  const fetchUserTasks = async (uid) => {
    const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', uid));
    const tasksSnapshot = await getDocs(tasksQuery);
    if (!tasksSnapshot.empty) {
      setTasks(tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } else {
      setTasks([]);
    }
  };

  const handleUpdateProfile = async () => {
    if (user) {
      const userDoc = doc(db, 'users', user.uid);
      await updateDoc(userDoc, {
        username: name,
        profilePicture,
      });
      setIsEditing(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    await AsyncStorage.removeItem('user');
    router.push('./index');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header} />
      {user && (
        <>
          <View style={styles.profileContainer}>
            <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
            <Text style={styles.name}>{name}</Text>
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Ionicons name="settings" size={24} color="black" />
            </TouchableOpacity>
            <Button title="Logout" onPress={handleLogout} />
          </View>
          {isEditing && (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
              />
              <TextInput
                style={styles.input}
                value={profilePicture}
                onChangeText={setProfilePicture}
                placeholder="Enter profile picture URL"
              />
              <Button title="Update Profile" onPress={handleUpdateProfile} />
            </View>
          )}
          <Text style={styles.label}>Tasks</Text>
          {tasks.length > 0 ? (
            <FlatList
              data={tasks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.taskItem}>
                  <Text>{item.title}</Text>
                </View>
              )}
            />
          ) : (
            <Text>There are no tasks</Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    height: 100,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editContainer: {
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  taskItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
  },
});