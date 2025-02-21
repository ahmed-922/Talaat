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
  Keyboard,
  TouchableWithoutFeedback,
  SafeAreaView,
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
    if (!recipientId) return;

    const fetchRecipient = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', recipientId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          setRecipient({
            uid: recipientId,
            username: userData.username || 'Unknown',
            profilePicture: userData.profilePicture
          });
        }
        // Only set loading to false after we've fetched the recipient data
        if (!chatId) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching recipient:', error);
        setLoading(false);
      }
    };
    fetchRecipient();
  }, [recipientId, chatId]);

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

    const fetchChat = async () => {
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
        }
        // Don't set loading to false here, let the recipient fetch handle it
      } catch (error) {
        console.error('Error finding chat:', error);
        setLoading(false);
      }
    };

    fetchChat();
  }, [currentUser, recipientId]);

  // Listen to messages once the chatId is available
  useEffect(() => {
    if (!chatId) return;
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageList = snapshot.docs.map((doc) => ({
        id: doc.id,
        text: doc.data().text,
        senderId: doc.data().senderId,
        timestamp: doc.data().timestamp,
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
          const chatPromises = snapshot.docs
            .filter(docSnapshot => docSnapshot.data().lastMessage !== null)
            .map(async (docSnapshot) => {
              const chatData = docSnapshot.data();
              const otherUserId = chatData.participants.find(
                (id: string) => id !== currentUser.uid
              );
              
              // Query users collection where uid matches otherUserId
              const usersRef = collection(db, 'users');
              const userQuery = query(usersRef, where('uid', '==', otherUserId));
              const userSnapshot = await getDocs(userQuery);
              
              let userData;
              if (!userSnapshot.empty) {
                userData = userSnapshot.docs[0].data();
              }

              return {
                id: docSnapshot.id,
                participants: chatData.participants,
                lastMessage: chatData.lastMessage,
                lastMessageTime: chatData.lastMessageTime,
                otherUser: {
                  uid: otherUserId,
                  username: userData?.username || 'Unknown',
                  profilePicture: userData?.profilePicture || 'https://example.com/default-avatar.png'
                },
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
      let localChatId = chatId;
      if (!localChatId) {
        // Create chat document only when sending first message
        const chatsRef = collection(db, 'chats');
        const newChatRef = await addDoc(chatsRef, {
          participants: [currentUser.uid, recipientId],
          lastMessage: newMessage,
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
      // Only update lastMessage if chat already existed
      if (chatId) {
        await updateDoc(doc(db, 'chats', localChatId), {
          lastMessage: newMessage,
          lastMessageTime: serverTimestamp(),
        });
      }
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
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen 
          options={{
            headerShown: false,
          }}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={styles.keyboardView}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
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
                style={styles.messagesList}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.messageContainer,
                      item.senderId === currentUser?.uid
                        ? styles.sentMessage
                        : styles.receivedMessage,
                    ]}
                  >
                    <Text style={[
                      styles.messageText,
                      item.senderId === currentUser?.uid
                        ? styles.sentMessageText
                        : styles.receivedMessageText,
                    ]}>
                      {item.text}
                    </Text>
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
                <TouchableOpacity 
                  style={[
                    styles.sendButton,
                    !newMessage.trim() && styles.sendButtonDisabled
                  ]} 
                  onPress={sendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
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
    fontSize: 16,
  },
  sentMessageText: {
    color: '#fff',
  },
  receivedMessageText: {
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
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
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 25,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    textAlign: 'center',
  },
});