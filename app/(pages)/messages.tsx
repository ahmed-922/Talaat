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
  const flatListRef = React.useRef<FlatList>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatId, setChatId] = useState<string | null>(null);

  // Reset chat states when leaving the chat
  useEffect(() => {
    if (!recipientId) {
      setHasNewMessage(false);
      setLastMessageId(null);
      setMessages([]);
      setChatId(null);
      setIsAtBottom(true);
      setContentHeight(0);
      setScrollViewHeight(0);
      setIsScrolling(false);
    }
  }, [recipientId]);

  // Handle scroll events to track position
  const handleScroll = (event: any) => {
    if (isScrolling) return; // Skip scroll handling if currently scrolling programmatically
    
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const scrollPosition = contentOffset.y;
    const visibleHeight = layoutMeasurement.height;
    const contentHeight = contentSize.height;

    // Consider bottom only when exactly at the bottom
    const isCloseToBottom = Math.abs(contentHeight - (scrollPosition + visibleHeight)) < 1;
    
    if (isCloseToBottom) {
      setHasNewMessage(false);
    }
    setIsAtBottom(isCloseToBottom);

    // Update heights for reference
    setContentHeight(contentHeight);
    setScrollViewHeight(visibleHeight);

    // Check if we've scrolled to see the new message
    if (hasNewMessage && messages.length > 0) {
      const distanceFromBottom = contentHeight - (scrollPosition + visibleHeight);
      if (distanceFromBottom < 1) { // Only when exactly at bottom
        setHasNewMessage(false);
        setLastMessageId(messages[messages.length - 1].id);
      }
    }
  };

  // Scroll to bottom function with safety checks
  const scrollToBottom = () => {
    if (flatListRef.current) {
      setIsScrolling(true); // Lock scroll handling
      setIsAtBottom(true); // Immediately hide button
      flatListRef.current.scrollToEnd({ animated: true });
      setHasNewMessage(false);
      if (messages.length > 0) {
        setLastMessageId(messages[messages.length - 1].id);
      }
      // Reset scroll lock after animation completes
      setTimeout(() => {
        setIsScrolling(false);
      }, 300);
    }
  };

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
      
      // Handle new message arrival
      if (messageList.length > 0) {
        const lastMessage = messageList[messageList.length - 1];
        
        // Always update lastMessageId to track latest message
        setLastMessageId(lastMessage.id);
        
        // Only show indicator or scroll if it's a new message from someone else
        if (lastMessage.id !== lastMessageId && lastMessage.senderId !== currentUser?.uid) {
          if (isAtBottom) {
            // If exactly at bottom, scroll without showing indicator
            setTimeout(() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToEnd({ animated: true });
              }
            }, 100);
          } else {
            // Show indicator if not at the bottom
            setHasNewMessage(true);
          }
        }
      }
    });

    return () => {
      unsubscribe();
      setHasNewMessage(false);
      setLastMessageId(null);
    };
  }, [chatId, isAtBottom]);

  // Update initial message handling
  useEffect(() => {
    if (messages.length > 0) {
      setLastMessageId(messages[messages.length - 1].id);
      // Ensure we're scrolled to bottom on initial load
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: false });
      }
    }
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
      
      // Only scroll to bottom if already at bottom
      if (isAtBottom && flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
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
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {recipient?.username || 'Chat'}
            </Text>
          </View>

          <View style={styles.chatContainer}>
            {/* Messages List */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10,
              }}
              onLayout={(event) => {
                setScrollViewHeight(event.nativeEvent.layout.height);
                // Initial scroll to bottom without animation
                if (messages.length > 0) {
                  flatListRef.current?.scrollToEnd({ animated: false });
                }
              }}
              onContentSizeChange={(w, h) => {
                setContentHeight(h);
                // Only scroll if user is already at bottom
                if (isAtBottom && messages.length > 0) {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }
              }}
              contentContainerStyle={styles.messagesContentContainer}
              showsVerticalScrollIndicator={true}
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

            {/* New Message Indicator */}
            {hasNewMessage && (
              <TouchableOpacity 
                style={styles.newMessageIndicator}
                onPress={scrollToBottom}
              >
                <Text style={styles.newMessageIndicatorText}>New message ↓</Text>
              </TouchableOpacity>
            )}

            {/* Scroll to Bottom Button */}
            {!isAtBottom && (
              <TouchableOpacity 
                style={styles.scrollToBottomButton}
                onPress={scrollToBottom}
              >
                <Text style={styles.scrollToBottomArrow}>↓</Text>
              </TouchableOpacity>
            )}

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
    width: '100%',
  },
  messagesContentContainer: {
    paddingHorizontal: 15,
    flexGrow: 1,
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
  chatContainer: {
    flex: 1,
    position: 'relative',
    width: '100%',
  },
  newMessageIndicator: {
    position: 'absolute',
    bottom: 70,
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  newMessageIndicatorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 80,
    left: 15,
    backgroundColor: '#fff',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  scrollToBottomArrow: {
    color: '#007AFF',
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: -2
  },
});