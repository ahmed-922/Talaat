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

/**
 * Custom hook to fetch a username given the user's UID.
 * This assumes your "users" collection has docs with a "uid" field matching the user's UID.
 */
function useUsername(uid: string) {
  const [username, setUsername] = useState("Unknown");

  useEffect(() => {
    if (!uid) return;

    async function fetchUsername() {
      try {
        // Query "users" collection for a doc where field "uid" == <the UID>
        const qUsers = query(collection(db, "users"), where("uid", "==", uid));
        const snapshot = await getDocs(qUsers);

        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          const data = userDoc.data();
          setUsername(data.username || "Unknown");
        } else {
          // No matching user doc found
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

/**
 * Main screen: fetches posts from "posts" collection, renders them in a list.
 */
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
        console.log("Fetched posts:", data);
        setPosts(data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchPosts();
  }, []);

  const renderPost = ({ item }: { item: any }) => {
    return <PostItem post={item} />;
  };

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

/**
 * A single post item.
 * - Uses subcollection "comments" for storing comments.
 * - Likes are an array of user UIDs in the post doc.
 * - Username is fetched via custom hook from the "users" collection.
 */
function PostItem({ post }: { post: any }) {
  const currentUser = auth.currentUser;
  const userUID = currentUser?.uid;

  // 1) Fetch the author's username from "users" collection
  const authorUsername = useUsername(post.byUser);

  // 2) Determine if current user already liked this post
  const alreadyLiked = post.likes?.includes(userUID);

  // 3) Modals for comment, share, and options
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);

  // 4) For new comment text
  const [newCommentText, setNewCommentText] = useState("");

  // 5) Real-time comments from subcollection "posts/{postId}/comments"
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    // Listen to the comments subcollection in real-time
    const commentsRef = collection(db, "posts", post.id, "comments");
    const unsubscribe = onSnapshot(commentsRef, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      // Sort descending by createdAt (if available)
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

  // ============= Handlers =============

  // Toggle like/unlike
  const handleLikeToggle = async () => {
    if (!userUID) return;
    try {
      const postRef = doc(db, "posts", post.id);
      if (alreadyLiked) {
        // remove userUID from likes
        await updateDoc(postRef, {
          likes: arrayRemove(userUID),
        });
      } else {
        // add userUID to likes
        await updateDoc(postRef, {
          likes: arrayUnion(userUID),
        });
      }
    } catch (error) {
      console.error("Error updating likes:", error);
    }
  };

  // Add a new comment to subcollection
  const handleAddComment = async () => {
    if (!userUID || !newCommentText.trim()) return;
    try {
      const commentsRef = collection(db, "posts", post.id, "comments");
      const newCommentDoc = doc(commentsRef); // auto-generated ID
      await setDoc(newCommentDoc, {
        username: currentUser.displayName || "Anonymous",
        text: newCommentText,
        createdAt: serverTimestamp(),
      });

      setNewCommentText("");
      setCommentModalVisible(false);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Share post
  const handleShare = async () => {
    try {
      await RNShare.share({
        message: `Check out this post: ${post.caption}`,
        url: post.img,
      });
      setShareModalVisible(false);
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  };

  // ============= Render =============
  return (
    <View style={styles.postContainer}>
      {/* Top bar: author username + triple-dot */}
      <View style={styles.topBar}>
        <View style={styles.Unp}>
      <Image
            source={{ uri: "https://via.placeholder.com/50" }}
            style={styles.userPhoto}
          />
        <Text style={styles.usernameText}>@{authorUsername}</Text>
        </View>
        <TouchableOpacity onPress={() => setOptionsModalVisible(true)}>
          <Text style={styles.optionsText}>. . .</Text>
        </TouchableOpacity>
      </View>

      {/* Post image */}
      <Image source={{ uri: post.img }} style={styles.postImage} />

      {/* Caption */}
      <Text style={styles.caption}>{post.caption}</Text>

      {/* Likes count */}
      <Text style={styles.likesCount}>
        {post.likes?.length || 0} {post.likes?.length === 1 ? "like" : "likes"}
      </Text>

      {/* Bottom bar: Like, Comment, Share */}
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

      {/* ===================== Modals ===================== */}

      {/* Comment Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Comments</Text>

            {/* List of existing comments */}
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

            {/* Input for new comment */}
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
            <Button
              title="Cancel"
              onPress={() => setShareModalVisible(false)}
              color="red"
            />
          </View>
        </View>
      </Modal>

      {/* Options Modal (triple-dot menu) */}
      <Modal
        visible={optionsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Post Options</Text>
            {userUID === post.byUser && (
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

// -----------------------------
// Styles
// -----------------------------
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
    display: 'flex',
    flexDirection: "row",
   
  },
  usernameText: {
    fontWeight: "bold",
    textAlignVertical: 'center',
    marginLeft: 10
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

  // Modal styles
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
  // Comments
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
  userPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "red",
  },
});
