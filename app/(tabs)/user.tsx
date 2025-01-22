import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, TouchableOpacity, FlatList, useColorScheme } from 'react-native';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol } from '@/components/ui/IconSymbol';

const DarkButton = ({ title, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.button, styles.darkButton]}>
    <Text style={styles.darkButtonText}>{title}</Text>
  </TouchableOpacity>
);

const LightButton = ({ title, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.button, styles.lightButton]}>
    <Text style={styles.lightButtonText}>{title}</Text>
  </TouchableOpacity>
);

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState([]);
  const [name, setName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserProfile(currentUser.uid);
        fetchUserTasks(currentUser.uid);
      } else {
        console.log('User is not logged in');
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
    console.log('User is logged out');
  };

  const themeTextStyle = colorScheme === 'light' ? styles.lightThemeText : styles.darkThemeText;
  const themeContainerStyle = colorScheme === 'light' ? styles.lightContainer : styles.darkContainer;
  const ButtonComponent = colorScheme === 'light' ? LightButton : DarkButton;

  return (
    <View style={[styles.container, themeContainerStyle]}>
      <View style={styles.header}>
        <Text style={themeTextStyle}>@{name}</Text>
        <Link href={{ pathname: 'settings', params: { user: JSON.stringify(user) } }} style={styles.settingsButton}>
          <IconSymbol name="line.3.horizontal" size={24} color={colorScheme === 'light' ? 'black' : 'white'} />
        </Link>
      </View>
      {user && (
        <>
          <View style={styles.profileContainer}>
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
            ) : (
              <Ionicons name="person-circle-outline" size={100} color={colorScheme === 'light' ? 'black' : 'white'} />
            )}
            <Text style={[styles.name, themeTextStyle]}>{name}</Text>

            <View>
            <View style={{ flexDirection: 'row', width: '70%', justifyContent: 'space-between' }}>
            <Text style={[styles.nsub, themeTextStyle]}>0</Text>
            <Text style={[styles.nsub, themeTextStyle]}>0/10</Text>
            <Text style={[styles.nsub, themeTextStyle]}>0</Text>
            </View>
            <View style={{ flexDirection: 'row', width: '70%', justifyContent: 'space-between' }}>
            <Text style={[styles.sub, themeTextStyle]}>Followers</Text>
            <Text style={[styles.sub, themeTextStyle]}>Reviews</Text>
            <Text style={[styles.sub, themeTextStyle]}>Task done</Text>
            </View>
            </View>

            <TouchableOpacity onPress={() => setIsEditing(true)}>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', width: '70%', justifyContent: 'space-between' }}>
              <ButtonComponent title="Edit Profile" onPress={() => setIsEditing(true)} />
              <ButtonComponent title="Share Profile" onPress={() => { /* Add share functionality here */ }} />
              <ButtonComponent title="+"/>
            </View>
          </View>
          {isEditing && (
            <View style={styles.editContainer}>
              <Text style={[styles.label, themeTextStyle]}>Username</Text>
              <TextInput
                style={[styles.input, themeTextStyle]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your username"
                placeholderTextColor={colorScheme === 'light' ? '#242c40' : '#d0d0c0'}
              />
              <Text style={[styles.label, themeTextStyle]}>Profile Picture URL</Text>
              <TextInput
                style={[styles.input, themeTextStyle]}
                value={profilePicture}
                onChangeText={setProfilePicture}
                placeholder="Enter profile picture URL"
                placeholderTextColor={colorScheme === 'light' ? '#242c40' : '#d0d0c0'}
              />
              <ButtonComponent title="Save" onPress={handleUpdateProfile} />
              <ButtonComponent title="Cancel" onPress={() => setIsEditing(false)} />
            </View>
          )}
          <Text style={[styles.label, themeTextStyle]}>Tasks</Text>
          {tasks.length > 0 ? (
            <FlatList
              data={tasks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.taskItem}>
                  <Text style={themeTextStyle}>{item.title}</Text>
                </View>
              )}
            />
          ) : (
            <Text style={themeTextStyle}>There are no tasks</Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    height: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileContainer: {
    alignItems: 'center',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  editContainer: {
    marginTop: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  lightContainer: {
    backgroundColor: '#d0d0c0',
  },
  darkContainer: {
    backgroundColor: '#0A0A0A',
    
  },
  lightThemeText: {
    color: '#242c40',
  },
  darkThemeText: {
    color: '#E6E8E9',
  },
  settingsButton: {
    padding: 10,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    alignItems: 'center',
  },
  darkButton: {
    backgroundColor: '#333',
  },
  lightButton: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 1,
  },
  darkButtonText: {
    color: '#fff',
  },
  lightButtonText: {
    color: '#000',
  },
  taskItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
  },
  sub: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  nsub: {
    fontSize: 14,
  }
});