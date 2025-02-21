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
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { Link } from "expo-router"; // Import Link for navigation
import Likes from "./svgs/likes";
import Likesfill from "./svgs/likesfill";
import Comments from "./svgs/comments";
import Share from "./svgs/share";
import TrendsIcon from "./svgs/trends";

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

// Custom hook to fetch a username given the user's UID.
function useUsername(uid: string) {
  const [username, setUsername] = useState("Unknown");

  useEffect(() => {
    if (!uid) return;
    async function fetchUsername() {
      try {
        const qUsers = query(collection(db, "users"), where("uid", "==", uid));
        const snapshot = await getDocs(qUsers);
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
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
  }, [uid]);

  return username;
}

// Custom hook to fetch a user's profile picture from Firestore
function useProfilePicture(uid: string) {
  const [profilePicture, setProfilePicture] = useState("");

  useEffect(() => {
    if (!uid) return;
    async function fetchProfilePicture() {
      try {
        const qUsers = query(collection(db, "users"), where("uid", "==", uid));
        const snapshot = await getDocs(qUsers);
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          const data = userDoc.data();
          setProfilePicture(data.profilePicture || ""); // Provide a fallback if needed
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
      }
    }
    fetchProfilePicture();
  }, [uid]);

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
  const [comments, setComments] = useState<any[]>([]);

  // Real-time subscription for comments.
  useEffect(() => {
    const commentsRef = collection(db, "posts", post.id, "comments");
    const unsubscribe = onSnapshot(commentsRef, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      // Sort newest to oldest by createdAt
      data.sort((a, b) => {
        if (a.createdAt?.seconds && b.createdAt?.seconds) {
          return b.createdAt.seconds - a.createdAt.seconds;
        }
        return 0;
      });
      setComments(data);
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

  // Handle adding a new comment.
  const handleAddComment = async () => {
    if (!userUID || !newCommentText.trim()) return;
    try {
      const commentsRef = collection(db, "posts", post.id, "comments");
      const newCommentDoc = doc(commentsRef);
      await setDoc(newCommentDoc, {
        username: currentUser?.displayName || "Anonymous",
        text: newCommentText,
        createdAt: serverTimestamp(),
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
          <Text style={styles.optionsText}>. . .</Text>
        </TouchableOpacity>
      </View>

      {/* Post image */}
      {localPost.img ? (
        <Image source={{ uri: localPost.img }} style={styles.postImage} />
      ) : null}

      {/* Timestamp */}
      <PostTimestamp createdAt={localPost.createdAt} />

      {/* Caption */}
      <Text style={styles.caption}>{localPost.caption}</Text>

      {/* Bottom Bar with Like, Comment & Share */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={handleLikeToggle}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {alreadyLiked ? <Likesfill /> : <Likes />}
            <Text style={styles.buttonText}>{localPost.likes?.length || 0}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCommentModalVisible(true)}>
          <Text style={styles.buttonText2}><Comments/></Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShareModalVisible(true)}>
          <Text style={styles.buttonText2}><Share/></Text>
        </TouchableOpacity>
      </View>

      {/* Comments Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Comments</Text>
            {comments.length > 0 ? (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <Text style={styles.commentUser}>{item.username}:</Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                )}
              />
            ) : (
              <Text style={{ marginBottom: 10 }}>No comments yet</Text>
            )}
            <TextInput
              style={styles.input}
              placeholder="Write a comment..."
              value={newCommentText}
              onChangeText={setNewCommentText}
            />
            <Button title="Add Comment" onPress={handleAddComment} />
            <Button title="Close" onPress={() => setCommentModalVisible(false)} color="red" />
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal
        visible={shareModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Share Post</Text>
            <Text>Share this post with your friends!</Text>
            <Button title="Share Now" onPress={handleShare} />
            <Button title="Cancel" onPress={() => setShareModalVisible(false)} color="red" />
          </View>
        </View>
      </Modal>

      {/* Options Modal */}
      <Modal
        visible={optionsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Post Options</Text>
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
            <Button title="Close" onPress={() => setOptionsModalVisible(false)} color="red" />
          </View>
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
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    maxHeight: "80%",
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
    flexDirection: "row",
    marginBottom: 5,
  },
  commentUser: {
    fontWeight: "bold",
    marginRight: 5,
  },
  commentText: {
    flex: 1,
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
  }
});
