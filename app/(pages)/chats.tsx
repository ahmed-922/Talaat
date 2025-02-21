import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
  orderBy,
} from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

export default function Chats() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Listen for auth changes to ensure user is logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.replace('/login');
      } else {
        setCurrentUser(user);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch chats where the current user is a participant, ordered by lastMessageTime
  useEffect(() => {
    if (!currentUser) return;

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatPromises = snapshot.docs.map(async (docSnapshot) => {
        const chatData = docSnapshot.data();
        // Get the other user's ID (the one that is not the current user's)
        const otherUserId = chatData.participants.find(
          (id: string) => id !== currentUser.uid
        );
        const userDoc = await getDoc(doc(db, 'users', otherUserId));
        const userData = userDoc.data();

        return {
          id: docSnapshot.id,
          ...chatData,
          otherUser: userData,
        };
      });

      const resolvedChats = await Promise.all(chatPromises);
      setChats(resolvedChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Chats</Text>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No chats available.</Text>
        }
        renderItem={({ item }) => (
          <Link
            href={`/messages?recipientId=${item.otherUser?.uid}`}
            style={styles.chatItem}
          >
            <Image
              source={{
                uri:
                  item.otherUser?.profilePicture ||
                  'https://example.com/default-avatar.png',
              }}
              style={styles.avatar}
            />
            <View style={styles.chatInfo}>
              <Text style={styles.username}>
                {item.otherUser?.username || 'Unknown'}
              </Text>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.lastMessage || 'No messages yet'}
              </Text>
            </View>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    textAlign: 'center',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    textDecorationLine: 'none',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  chatInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  lastMessage: {
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});
