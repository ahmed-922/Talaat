import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

// TypeScript interfaces
interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
}

interface Chat {
  id: string;
  participants: string[];
  lastMessage: string | null;
  lastMessageTime: any;
  otherUser: {
    uid: string;
    username: string;
    profilePicture?: string;
  };
}

export default function Messages() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const recipientId = params.recipientId as string;

  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatId, setChatId] = useState<string | null>(null);

  // Fetch recipient's data when recipientId is provided
  useEffect(() => {
    if (recipientId) {
      const fetchRecipient = async () => {
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('uid', '==', recipientId));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            setRecipient(snapshot.docs[0].data());
          }
        } catch (error) {
          console.error('Error fetching recipient:', error);
        }
      };
      fetchRecipient();
    }
  }, [recipientId]);

  // Listen for auth changes
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

  // For direct chat: Fetch or create the chat between currentUser and recipient
  useEffect(() => {
    if (!currentUser || !recipientId) return;

    const fetchOrCreateChat = async () => {
      try {
        const chatsRef = collection(db, 'chats');
        const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));
        const snapshot = await getDocs(q);

        // Look for an existing chat with the recipient
        const existingChat = snapshot.docs.find((doc) =>
          doc.data().participants.includes(recipientId)
        );

        if (existingChat) {
          setChatId(existingChat.id);
        } else {
          // Create a new chat if one doesn't exist
          const newChatRef = await addDoc(chatsRef, {
            participants: [currentUser.uid, recipientId],
            lastMessage: null,
            lastMessageTime: serverTimestamp(),
          });
          setChatId(newChatRef.id);
        }
      } catch (error) {
        console.error('Error setting up chat:', error);
      }
    };

    fetchOrCreateChat();
  }, [currentUser, recipientId]);

  // Listen to messages once the chatId is available
  useEffect(() => {
    if (!chatId) return;
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messageList);
      setLoading(false);
    });
    return unsubscribe;
  }, [chatId]);

  // Fetch list of chats if no recipientId is provided (e.g., main messages screen)
  useEffect(() => {
    if (recipientId) return; // Skip if in a direct chat

    if (!currentUser) return;
    const fetchChats = async () => {
      try {
        const chatsRef = collection(db, 'chats');
        const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const chatPromises = snapshot.docs.map(async (docSnapshot) => {
            const chatData = docSnapshot.data();
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
        return unsubscribe;
      } catch (error) {
        console.error('Error fetching chats:', error);
        setLoading(false);
      }
    };

    fetchChats();
  }, [currentUser, recipientId]);

  // Send a new message using the chatId
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !recipientId) return;
    try {
      // Ensure chatId exists (should normally be set by the useEffect above)
      let localChatId = chatId;
      if (!localChatId) {
        const chatsRef = collection(db, 'chats');
        const newChatRef = await addDoc(chatsRef, {
          participants: [currentUser.uid, recipientId],
          lastMessage: null,
          lastMessageTime: serverTimestamp(),
        });
        localChatId = newChatRef.id;
        setChatId(localChatId);
      }
      const messagesRef = collection(db, 'chats', localChatId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
      });
      // Update the chat document with the latest message details
      await updateDoc(doc(db, 'chats', localChatId), {
        lastMessage: newMessage,
        lastMessageTime: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Loading indicator while data is fetched
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Direct chat view (when recipientId is provided)
  if (recipientId) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: false,
          }}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {recipient?.username || 'Chat'}
            </Text>
          </View>

          {/* Messages List */}
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageContainer,
                  item.senderId === currentUser?.uid
                    ? styles.sentMessage
                    : styles.receivedMessage,
                ]}
              >
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            )}
          />

          {/* Message Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </>
    );
  }

  // Chat list view (when no direct chat is selected)
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Messages</Text>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() =>
              router.push(`/messages?recipientId=${item.otherUser.uid}`)
            }
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
              <Text style={styles.username}>{item.otherUser.username}</Text>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.lastMessage || 'No messages yet'}
              </Text>
            </View>
          </TouchableOpacity>
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
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    textAlign: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 24,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
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
  messageContainer: {
    margin: 10,
    padding: 10,
    borderRadius: 10,
    maxWidth: '70%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
