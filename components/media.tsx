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
  Share as RNShare 
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
  where 
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { Link } from "expo-router"; // Import Link for navigation

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

// Main Media screen: fetches posts from the "posts" collection and renders them.
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
        <FlatList 
          data={posts} 
          renderItem={renderPost} 
          keyExtractor={(item) => item.id} 
        />
      )}
    </View>
  );
}

// PostItem component.
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
        <Link
          href={`../(pages)/UserProfile?uid=${localPost.byUser}`}
          style={styles.Unp}
        >
          <Image
            source={{ uri: authorProfilePicture }}
            style={styles.userPhoto}
          />
          <Text style={styles.usernameText}>@{authorUsername}</Text>
        </Link>
        <TouchableOpacity onPress={() => setOptionsModalVisible(true)}>
          <Text style={styles.optionsText}>. . .</Text>
        </TouchableOpacity>
      </View>

      {/* Post image, caption, likes, and bottom bar */}
      {localPost.img ? (
        <Image source={{ uri: localPost.img }} style={styles.postImage} />
      ) : null}
      <Text style={styles.caption}>{localPost.caption}</Text>
      <Text style={styles.likesCount}>
        {localPost.likes?.length || 0}{" "}
        {localPost.likes?.length === 1 ? "like" : "likes"}
      </Text>
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={handleLikeToggle}>
          <Text style={styles.buttonText}>
            {alreadyLiked ? "❤️" : "🤍"} Like
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCommentModalVisible(true)}>
          <Text style={styles.buttonText}>💬 Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShareModalVisible(true)}>
          <Text style={styles.buttonText}>🔗 Share</Text>
        </TouchableOpacity>
      </View>

      {/* Modals for Comments, Share, and Options */}
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
            <Button
              title="Close"
              onPress={() => setCommentModalVisible(false)}
              color="red"
            />
          </View>
        </View>
      </Modal>

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
            <Button
              title="Cancel"
              onPress={() => setShareModalVisible(false)}
              color="red"
            />
          </View>
        </View>
      </Modal>

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
            <Button
              title="Close"
              onPress={() => setOptionsModalVisible(false)}
              color="red"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
  },
  caption: {
    marginBottom: 4,
  },
  likesCount: {
    marginBottom: 4,
    fontStyle: "italic",
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  buttonText: {
    fontSize: 16,
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
});
