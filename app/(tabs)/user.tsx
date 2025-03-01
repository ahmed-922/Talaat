import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useColorScheme, FlatList } from 'react-native';
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [bio, setBio] = useState('');
  const [posts, setPosts] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const colorScheme = useColorScheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserProfile(currentUser.uid); // Fetch user profile directly using UID
        fetchUserPosts(currentUser.uid); // Fetch user posts directly using UID
      } else {
        console.log("User is not logged in");
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch the user profile from Firestore if document ID matches currentUser.uid
  const fetchUserProfile = async (userId) => {
    try {
      const userDocRef = doc(db, 'users', userId); // Directly reference by ID
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setName(userData.username || '');
        setProfilePicture(userData.profilePicture || '');
        setBio(userData.bio || '');
        setFollowersCount(userData.followers?.length || 0);
        setFollowingCount(userData.following?.length || 0);
      } else {
        console.log('No matching user document found');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Fetch the user posts from Firestore if document ID matches currentUser.uid
  const fetchUserPosts = async (userId) => {
    try {
      const postsQuery = query(collection(db, 'posts'), where('userId', '==', userId));
      const postsSnapshot = await getDocs(postsQuery);
      const postsData = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const themeTextStyle = colorScheme === 'light' ? styles.lightThemeText : styles.darkThemeText;
  const themeContainerStyle = colorScheme === 'light' ? styles.lightContainer : styles.darkContainer;

  return (
    <View style={[styles.container, themeContainerStyle]}>
      <View style={styles.header}>
        <Text style={styles.uname}>@{name}</Text>
        <Link
          href={{ pathname: 'settings', params: { user: JSON.stringify(user) } }}
          style={styles.settingsButton}
        >
          <IconSymbol
            name="line.3.horizontal"
            size={24}
            color={colorScheme === 'light' ? 'black' : 'white'}
          />
        </Link>
      </View>

      {user && (
        <View style={styles.content}>
          <View style={styles.profileContainer}>
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
            ) : (
              <Ionicons
                name="person-circle-outline"
                size={100}
                color={colorScheme === 'light' ? 'black' : 'white'}
              />
            )}
            <Text style={[styles.name, themeTextStyle, styles.centerText]}>{name}</Text>
            <Text style={[styles.bio, themeTextStyle, styles.centerText]}>{bio}</Text>

            {/* Centered Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statContainer}>
                <Text style={[styles.statCount, themeTextStyle]}>{posts.length}</Text>
                <Text style={[styles.statLabel, themeTextStyle]}>Posts</Text>
              </View>
              <View style={styles.statContainer}>
                <Text style={[styles.statCount, themeTextStyle]}>{followersCount}</Text>
                <Text style={[styles.statLabel, themeTextStyle]}>Followers</Text>
              </View>
              <View style={styles.statContainer}>
                <Text style={[styles.statCount, themeTextStyle]}>{followingCount}</Text>
                <Text style={[styles.statLabel, themeTextStyle]}>Following</Text>
              </View>
            </View>

            {/* Buttons Row with Improved Design */}
            <View style={styles.buttonRow}>
              <Link
                href="../(pages)/EditProfile"
                style={[styles.button, colorScheme === 'light' ? styles.lightButton : styles.darkButton]}
              >
                <Text style={colorScheme === 'light' ? styles.lightButtonText : styles.darkButtonText}>
                  Edit Profile
                </Text>
              </Link>
              <TouchableOpacity
                style={[styles.button, colorScheme === 'light' ? styles.lightButton : styles.darkButton]}
                onPress={() => console.log('Share profile pressed')}
              >
                <Text style={colorScheme === 'light' ? styles.lightButtonText : styles.darkButtonText}>
                  Share Profile
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, colorScheme === 'light' ? styles.lightButton : styles.darkButton]}
                onPress={() => console.log('Plus button pressed')}
              >
                <Text style={colorScheme === 'light' ? styles.lightButtonText : styles.darkButtonText}>
                  +
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.sectionLabel, themeTextStyle, styles.centerText]}>Posts</Text>
          <FlatList
            data={posts}
            renderItem={({ item }) => (
              <Link href={`../(pages)/post?id=${item.id}`} asChild>
                <TouchableOpacity style={styles.postItem}>
                  <Image source={{ uri: item.mediaUrl }} style={styles.postImage} />
                </TouchableOpacity>
              </Link>
            )}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.postsContainer}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center', // centers all content horizontally
  },
  header: {
    width: '100%',
    height: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uname: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 10,
  },
  content: {
    width: '100%',
    alignItems: 'center', // centers content within the main area
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
  bio: {
    fontSize: 16,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  statContainer: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  statCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  sectionLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  lightContainer: {
    backgroundColor: '#d0d0c0',
    width: '100%',
    flex: 1,
  },
  darkContainer: {
    backgroundColor: '#0A0A0A',
    width: '100%',
    flex: 1,
  },
  lightThemeText: {
    color: '#242c40',
  },
  darkThemeText: {
    color: '#E6E8E9',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  lightButton: {
    backgroundColor: '#fff',
  },
  darkButton: {
    backgroundColor: '#333',
  },
  lightButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  darkButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  centerText: {
    textAlign: 'center',
  },
  postsContainer: {
    paddingVertical: 20,
  },
  postItem: {
    flex: 1,
    margin: 5,
    aspectRatio: 1,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
});