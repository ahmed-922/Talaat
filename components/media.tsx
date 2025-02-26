import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  Button,
  FlatList,
  Share as RNShare,
  PanResponder,
  Animated,
} from "react-native";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  query,
  where,
  getDoc,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { Link } from "expo-router"; // Import Link for navigation
import Likes from "./svgs/likes";
import Likesfill from "./svgs/likesfill";
import Comments from "./svgs/comments";
import Share from "./svgs/share";


// --- Helper Functions for Timestamp Formatting ---

function timeAgo(date: Date) {
  const now = new Date();
  const secondsElapsed = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (secondsElapsed < 60) {
    return "Just now";
  }

  const minutes = Math.floor(secondsElapsed / 60);
  if (minutes < 60) {
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }

  const years = Math.floor(months / 12);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

function formatTime(date: Date) {
  // 24-hour format with seconds
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// --- Component to Display the Post Timestamp ---

function PostTimestamp({ createdAt }: { createdAt: any }) {
  if (!createdAt || typeof createdAt.toDate !== "function") return null;
  const date = createdAt.toDate();
  return (
    <Text style={styles.timestamp}>
      {timeAgo(date)} at {formatTime(date)}
    </Text>
  );
}

// --- Custom Hooks for Fetching User Data ---

// Custom hook to fetch a username directly by document ID
function useUsername(docId: string) {
  const [username, setUsername] = useState("Unknown");

  useEffect(() => {
    if (!docId) return;
    async function fetchUsername() {
      try {
        // Direct document reference using docId
        const userRef = doc(db, "users", docId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data.username || "Unknown");
        } else {
          setUsername("Unknown");
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    }
    fetchUsername();
  }, [docId]);

  return username;
}

// Custom hook to fetch a user's profile picture directly by document ID
function useProfilePicture(docId: string) {
  const [profilePicture, setProfilePicture] = useState("");

  useEffect(() => {
    if (!docId) return;
    async function fetchProfilePicture() {
      try {
        // Direct document reference using docId
        const userRef = doc(db, "users", docId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfilePicture(data.profilePicture || "");
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
      }
    }
    fetchProfilePicture();
  }, [docId]);

  return profilePicture;
}

// --- Main Media Screen ---

export default function Media() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "posts"));
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setPosts(data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };
    fetchPosts();
  }, []);

  const renderPost = ({ item }: { item: any }) => <PostItem post={item} />;

  return (
    <View style={styles.container}>
      {posts.length === 0 ? (
        <Text style={styles.noPosts}>No posts available</Text>
      ) : (
        <FlatList data={posts} renderItem={renderPost} keyExtractor={(item) => item.id} />
      )}
    </View>
  );
}

// --- PostItem Component ---

// Add interface for properly typed comments


interface CommentWithUser {
  id: string;
  text: string;
  userId: string;
  createdAt: any;
  user: {
    username: string;
    profilePicture: string;
  };
}

function PostItem({ post }: { post: any }) {
  const currentUser = auth.currentUser;
  const userUID = currentUser?.uid;

  // Local state for the post document.
  const [localPost, setLocalPost] = useState(post);

  // Real-time subscription for the post document.
  useEffect(() => {
    const postRef = doc(db, "posts", post.id);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        setLocalPost({ id: docSnap.id, ...docSnap.data() });
      }
    });
    return () => unsubscribe();
  }, [post.id]);

  // Fetch the author's username and profile picture using custom hooks.
  const authorUsername = useUsername(localPost.byUser);
  const authorProfilePicture = useProfilePicture(localPost.byUser);

  // Check if the current user has liked the post.
  const alreadyLiked = localPost.likes?.includes(userUID);

  // Local state for modals.
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [comments, setComments] = useState<CommentWithUser[]>([]);

  // Add new state for modal animation
  const [modalYPosition] = useState(new Animated.Value(0));
  const [isClosing, setIsClosing] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));
  const [modalHeight, setModalHeight] = useState(0);

  // Unified pan responder for modals
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        modalYPosition.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.vy > 0.5 || gestureState.dy > 100) {
          Animated.spring(modalYPosition, {
            toValue: modalHeight,
            useNativeDriver: true,
            tension: 65,
            friction: 12
          }).start(() => {
            closeModal();
          });
        } else {
          Animated.spring(modalYPosition, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 12
          }).start();
        }
      }
    })
  ).current;

  // Real-time subscription for comments using document ID
  useEffect(() => {
    if (!post.id) return;

    const commentsRef = collection(db, "posts", post.id, "comments");
    const commentsQuery = query(commentsRef, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(commentsQuery, async (snapshot) => {
      try {
        const commentsWithUserData = await Promise.all(
          snapshot.docs.map(async (commentDoc) => {
            const commentData = commentDoc.data();
            
            if (!commentData || !commentData.userId) {
              console.log("Missing comment data:", commentDoc.id);
              return null;
            }

            try {
              const userRef = doc(db, "users", commentData.userId);
              const userSnap = await getDoc(userRef);
              
              if (userSnap.exists()) {
                const userData = userSnap.data();
                return {
                  id: commentDoc.id,
                  text: commentData.text || '',
                  userId: commentData.userId,
                  createdAt: commentData.createdAt,
                  user: {
                    username: userData.username || "Unknown User",
                    profilePicture: userData.profilePicture || "../photos/defaultpfp.png"
                  }
                };
              }
            } catch (userError) {
              console.error("Error fetching user data for comment:", userError);
            }
            
            return {
              id: commentDoc.id,
              text: commentData.text || '',
              userId: commentData.userId,
              createdAt: commentData.createdAt,
              user: {
                username: "Unknown User",
                profilePicture: "../photos/defaultpfp.png"
              }
            };
          })
        );

        const validComments = commentsWithUserData.filter(Boolean);
        setComments(validComments);
      } catch (error) {
        console.error("Error fetching comments:", error);
        setComments([]);
      }
    }, (error) => {
      console.error("Error in comments listener:", error);
      setComments([]);
    });
    
    return () => unsubscribe();
  }, [post.id]);

  // Handle like/unlike.
  const handleLikeToggle = async () => {
    if (!userUID) return;
    try {
      const postRef = doc(db, "posts", post.id);
      if (alreadyLiked) {
        await updateDoc(postRef, { likes: arrayRemove(userUID) });
      } else {
        await updateDoc(postRef, { likes: arrayUnion(userUID) });
      }
    } catch (error) {
      console.error("Error updating likes:", error);
    }
  };

  // Handle adding a new comment with document ID
  const handleAddComment = async () => {
    if (!currentUser || !newCommentText.trim()) return;
    try {
      const commentsRef = collection(db, "posts", post.id, "comments");
      const newCommentDoc = doc(commentsRef);
      
      await setDoc(newCommentDoc, {
        userId: currentUser.uid,
        text: newCommentText,
        createdAt: serverTimestamp()
      });
      
      setNewCommentText("");
      setCommentModalVisible(false);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Handle sharing the post.
  const handleShare = async () => {
    try {
      await RNShare.share({
        message: `Check out this post: ${localPost.caption}`,
        url: localPost.img,
      });
      setShareModalVisible(false);
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  };

  const renderComment = ({ item }: { item: CommentWithUser }) => (
    <View style={styles.commentItem}>
      <Image 
        source={{ uri: item.user.profilePicture }} 
        style={styles.commentUserImage} 
      />
      <View style={styles.commentContent}>
        <Text style={styles.commentUsername}>{item.user.username}</Text>
        <Text style={styles.commentText}>{item.text}</Text>
        {item.createdAt && (
          <Text style={styles.commentTime}>
            {timeAgo(item.createdAt.toDate())}
          </Text>
        )}
      </View>
    </View>
  );

  // Handle modal visibility with animation
  useEffect(() => {
    if (commentModalVisible || shareModalVisible || optionsModalVisible) {
      modalYPosition.setValue(0);
      Animated.spring(modalAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11
      }).start();
    } else {
      Animated.spring(modalAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11
      }).start();
    }
  }, [commentModalVisible, shareModalVisible, optionsModalVisible]);

  const closeModal = () => {
    if (isClosing) return; // Avoid redundant triggers while closing
    
    setIsClosing(true);
  
    // Animate the modal sliding down
    Animated.timing(modalYPosition, {
      toValue: 1000, // Slide the modal down
      duration: 200, // Adjust the duration to make it smoother
      useNativeDriver: true,
    }).start();
  
    // Delay hiding modal visibility until after the animation
    setTimeout(() => {
      setCommentModalVisible(false);
      setShareModalVisible(false);
      setOptionsModalVisible(false);
      setIsClosing(false);
    }, 200); // Match the duration of the slide-down animation
  };
  

  
  return (
    <View style={styles.postContainer}>
      {/* Top Bar: Clickable user info wrapped in a Link */}
      <View style={styles.topBar}>
        <Link href={`../(pages)/UserProfile?uid=${localPost.byUser}`} style={styles.Unp}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image source={{ uri: authorProfilePicture || '../photos/defaultpfp.png'  }} style={styles.userPhoto} resizeMode="contain" />
            <Text style={styles.usernameText}>{authorUsername}</Text>
          </View>
        </Link>
        <TouchableOpacity onPress={() => setOptionsModalVisible(true)}>
          <Text style={styles.optionsText}>...</Text>
        </TouchableOpacity>
      </View>

      {/* Make the post content clickable */}
      <Link href={`../(pages)/post?id=${post.id}`} asChild>
        <TouchableOpacity>
          {/* Post image */}
          {localPost.img ? (
            <Image source={{ uri: localPost.img }} style={styles.postImage} />
          ) : null}

          {/* Timestamp */}
          <PostTimestamp createdAt={localPost.createdAt} />

          {/* Caption */}
          <Text style={styles.caption}>{localPost.caption}</Text>
        </TouchableOpacity>
      </Link>

      {/* Bottom Bar with Like, Comment & Share */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={handleLikeToggle}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {alreadyLiked ? <Likesfill /> : <Likes />}
            <Text style={styles.buttonText}>{localPost.likes?.length || ''}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCommentModalVisible(true)}>
          <Text style={styles.buttonText2}><Comments fill='white' stroke="black"/></Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShareModalVisible(true)}>
          <Text style={styles.buttonText2}><Share/></Text>
        </TouchableOpacity>
      </View>

      {/* Unified Modal for Comments, Share, and Options */}
      <Modal
        visible={commentModalVisible || shareModalVisible || optionsModalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                transform: [{
                  translateY: modalYPosition.interpolate({
                    inputRange: [0, modalHeight],
                    outputRange: [0, modalHeight],
                    extrapolate: 'clamp'
                  })
                }],
                opacity: modalAnimation
              }
            ]}
            onLayout={(event) => {
              setModalHeight(event.nativeEvent.layout.height);
            }}
          >
            {/* Draggable Handle with visual feedback */}
            <View {...panResponder.panHandlers}>
              <View style={styles.modalDragHandle} />
            </View>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {commentModalVisible ? `Comments (${comments.length})` : shareModalVisible ? 'Share Post' : 'Post Options'}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={closeModal}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {commentModalVisible && (
              <>
                <FlatList
                  data={comments}
                  renderItem={renderComment}
                  keyExtractor={(item) => item.id}
                  style={styles.commentsList}
                  ListEmptyComponent={
                    <Text style={styles.noCommentsText}>No comments yet</Text>
                  }
                />
                <View style={styles.commentInputContainer}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Write a comment..."
                    value={newCommentText}
                    onChangeText={setNewCommentText}
                    multiline
                  />
                  <TouchableOpacity
                    style={[
                      styles.commentButton,
                      !newCommentText.trim() && styles.commentButtonDisabled
                    ]}
                    onPress={handleAddComment}
                    disabled={!newCommentText.trim()}
                  >
                    <Text style={styles.commentButtonText}>Post</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {shareModalVisible && (
              <View style={styles.modalContent}>
                <Text>Share this post with your friends!</Text>
                <Button title="Share Now" onPress={handleShare} />
                <Button title="Cancel" onPress={closeModal} color="red" />
              </View>
            )}

            {optionsModalVisible && (
              <View style={styles.modalContent}>
                {userUID === localPost.byUser && (
                  <TouchableOpacity style={styles.optionItem}>
                    <Text>Delete Post (not implemented)</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.optionItem}>
                  <Text>Report Post (not implemented)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem}>
                  <Text>Copy Link (not implemented)</Text>
                </TouchableOpacity>
                <Button title="Close" onPress={closeModal} color="red" />
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
 
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  noPosts: {
    marginTop: 50,
    textAlign: "center",
    fontSize: 16,
    color: "#666",
  },
  postContainer: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingBottom: 10,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  Unp: {
    flexDirection: "row",
    alignItems: "center",
  },
  userPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "red",
  },
  usernameText: {
    fontWeight: "bold",
    marginLeft: 10,
  },
  optionsText: {
    fontSize: 20,
    marginRight: 10,
  },
  postImage: {
    width: "100%",
    height: 300,
    marginBottom: 8,
    resizeMode: "cover",
    borderRadius: 10
  },
  caption: {
    marginBottom: 4,
  },
  timestamp: {
    marginBottom: 4,
    color: "#666",
    fontSize: 12,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  buttonText: {
    fontSize: 16,
  },
  buttonNum: {
    color: "black",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    height: '80%', // Make modal taller
    marginTop: 'auto', // Push to bottom
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  commentItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  commentUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
  },
  commentsList: {
    flex: 1, // Take remaining space
  },
  noCommentsText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
  commentInputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 10,
    marginTop: 'auto',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxHeight: 100,
    marginBottom: 10,
  },
  optionItem: {
    paddingVertical: 8,
  },
  logo: {
    marginTop: 20,
    marginBottom: 20,
  },
  buttonText2: {
    height: 24,
    width: 24
  },
  commentButton: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  commentButtonDisabled: {
    backgroundColor: '#ccc',
  },
  commentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Changed from center to space-between
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
    position: 'absolute',
    right: 10,
    top: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#999',
    fontWeight: 'bold',
  },
  modalDragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginVertical: 8,
    opacity: 0.8, // Slightly transparent for better visual feedback
  },
});
