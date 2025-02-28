import React, { useEffect, useState } from "react";
import { View, Text, Image, ActivityIndicator, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput, Alert, ScrollView } from "react-native";
import { useLocalSearchParams, Link, router } from "expo-router";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import Likes from "../../components/svgs/likes";
import Likesfill from "../../components/svgs/likesfill";
import Comments from "../../components/svgs/comments";
import ShareIcon from "../../components/svgs/share";
import { Share } from "react-native";

// Define proper interfaces for our data
interface PostData {
  id: string;
  caption?: string;
  mediaUrl?: string;
  userId?: string;
  likes?: string[];
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
  [key: string]: any;
}

interface UserData {
  uid: string;
  username: string;
  profilePicture?: string;
  following?: string[];
  followers?: string[];
  [key: string]: any;
}

interface CommentData {
  id: string;
  text: string;
  userId: string;
  username: string;
  createdAt: any;
}

// Custom hook to fetch a username given the user's document ID
function useUsername(uid: string | undefined) {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    
    async function fetchUsername() {
      try {
        // Get the user document directly by its ID
        const userDocRef = doc(db, "users", uid as string);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data.username || null);
        } else {
          // Fallback to legacy query if direct lookup fails
          const qUsers = query(collection(db, "users"), where("uid", "==", uid));
          const snapshot = await getDocs(qUsers);
          if (!snapshot.empty) {
            const userDocFromQuery = snapshot.docs[0];
            const data = userDocFromQuery.data();
            setUsername(data.username || null);
          } else {
            console.log("No user document found for ID:", uid);
            setUsername(null);
          }
        }
      } catch (error) {
        console.error("Error fetching username:", error);
        setUsername(null);
      }
    }
    
    fetchUsername();
  }, [uid]);

  return username;
}

// Custom hook to fetch a user's profile picture from Firestore
function useProfilePicture(uid: string | undefined) {
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    
    async function fetchProfilePicture() {
      try {
        // Get the user document directly by its ID
        const userDocRef = doc(db, "users", uid as string);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfilePicture(data.profilePicture || null);
        } else {
          // Fallback to legacy query if direct lookup fails
          const qUsers = query(collection(db, "users"), where("uid", "==", uid));
          const snapshot = await getDocs(qUsers);
          if (!snapshot.empty) {
            const userDocFromQuery = snapshot.docs[0];
            const data = userDocFromQuery.data();
            setProfilePicture(data.profilePicture || null);
          } else {
            setProfilePicture(null);
          }
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
        setProfilePicture(null);
      }
    }
    
    fetchProfilePicture();
  }, [uid]);

  return profilePicture;
}

// Custom hook to check if current user is following another user
function useIsFollowing(currentUserUid: string | undefined, targetUserUid: string | undefined) {
  const [isFollowing, setIsFollowing] = useState<boolean>(false);

  useEffect(() => {
    if (!currentUserUid || !targetUserUid) {
      console.log("Missing user IDs for follow check:", { currentUserUid, targetUserUid });
      return;
    }

    // Fetch the target user's document to check if current user is in their followers
    const fetchFollowStatus = async () => {
      try {
        // Get the target user document directly by its ID
        const targetUserDocRef = doc(db, "users", targetUserUid as string);
        const targetUserDoc = await getDoc(targetUserDocRef);
        
        if (targetUserDoc.exists()) {
          const userData = targetUserDoc.data();
          const followers = userData.followers || [];
          const isUserFollowed = followers.includes(currentUserUid);
          console.log(`Follow status check: currentUser ${currentUserUid} following ${targetUserUid}: ${isUserFollowed}`);
          setIsFollowing(isUserFollowed);
        } else {
          // Fallback to legacy query if direct lookup fails
          const qUsers = query(collection(db, "users"), where("uid", "==", targetUserUid));
          const snapshot = await getDocs(qUsers);
          
          if (!snapshot.empty) {
            const userData = snapshot.docs[0].data();
            const followers = userData.followers || [];
            const isUserFollowed = followers.includes(currentUserUid);
            console.log(`Follow status check: currentUser ${currentUserUid} following ${targetUserUid}: ${isUserFollowed}`);
            setIsFollowing(isUserFollowed);
          }
        }
      } catch (error) {
        console.error("Error checking follow status:", error);
      }
    };

    fetchFollowStatus();

    // Set up real-time listener for follow status changes
    const unsubscribe = onSnapshot(
      doc(db, "users", targetUserUid as string),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          const followers = userData.followers || [];
          const isUserFollowed = followers.includes(currentUserUid);
          console.log(`Real-time follow status update: ${isUserFollowed}`);
          setIsFollowing(isUserFollowed);
        }
      },
      (error) => {
        console.error("Error in follow status listener:", error);
      }
    );
    
    return () => unsubscribe();
  }, [currentUserUid, targetUserUid]);

  return isFollowing;
}

export default function Post() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState<string[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [unfollowModalVisible, setUnfollowModalVisible] = useState(false);
  const currentUser = auth.currentUser;
  
  // Use custom hooks to fetch user data
  const authorUsername = useUsername(post?.userId);
  const authorProfilePicture = useProfilePicture(post?.userId);
  const isFollowing = useIsFollowing(currentUser?.uid, post?.userId);
  
  // Log when isFollowing changes
  useEffect(() => {
    console.log(`isFollowing state in component: ${isFollowing}`);
  }, [isFollowing]);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const fetchPost = async () => {
      setLoading(true);
      try {
        const postRef = doc(db, "posts", id as string);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
          const postData = { id: postSnap.id, ...postSnap.data() } as PostData;
          setPost(postData);
          setLikes(postData.likes || []);
          setIsLiked(currentUser && postData.likes?.includes(currentUser.uid) || false);
        } else {
          setPost(null);
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();

    // Listen for comments in real-time
    const commentsRef = collection(db, 'posts', id, 'comments');
    const commentsQuery = query(commentsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommentData[];
      setComments(commentsData);
    });
    
    return () => unsubscribe();
  }, [id, currentUser]);

  const handleLike = async () => {
    if (!currentUser || !id || typeof id !== 'string' || !post) return;
    
    try {
      const postRef = doc(db, "posts", id);
      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(currentUser.uid)
        });
        setLikes(likes.filter(uid => uid !== currentUser.uid));
        setIsLiked(false);
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(currentUser.uid)
        });
        setLikes([...likes, currentUser.uid]);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  const handleComment = async () => {
    if (!currentUser || !newComment.trim() || !id || typeof id !== 'string') return;

    try {
      const commentsRef = collection(db, 'posts', id, 'comments');
      await addDoc(commentsRef, {
        text: newComment,
        userId: currentUser.uid,
        username: currentUser.displayName || 'Anonymous',
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleShare = async () => {
    if (!post || !post.mediaUrl) return;
    
    try {
      await Share.share({
        message: `Check out this post!`,
        url: post.mediaUrl
      });
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !post?.userId) {
      console.log("Cannot follow: missing current user or post author");
      return;
    }
    
    // If already following, show confirmation dialog
    if (isFollowing) {
      setUnfollowModalVisible(true);
      return;
    }
    
    // Otherwise, follow the user
    try {
      console.log(`Following user: ${post.userId}`);
      const currentUserRef = doc(db, "users", currentUser.uid);
      const targetUserRef = doc(db, "users", post.userId);
      
      // Follow user
      await updateDoc(currentUserRef, {
        following: arrayUnion(post.userId)
      });
      
      await updateDoc(targetUserRef, {
        followers: arrayUnion(currentUser.uid)
      });
      
      console.log("Follow successful");
    } catch (error) {
      console.error('Error updating follow status:', error);
      Alert.alert("Error", "Something went wrong while updating follow status.");
    }
  };
  
  const handleUnfollow = async () => {
    if (!currentUser || !post?.userId) {
      console.log("Cannot unfollow: missing current user or post author");
      return;
    }
    
    try {
      console.log(`Unfollowing user: ${post.userId}`);
      const currentUserRef = doc(db, "users", currentUser.uid);
      const targetUserRef = doc(db, "users", post.userId);
      
      // Unfollow user
      await updateDoc(currentUserRef, {
        following: arrayRemove(post.userId)
      });
      
      await updateDoc(targetUserRef, {
        followers: arrayRemove(currentUser.uid)
      });
      
      setUnfollowModalVisible(false);
      console.log("Unfollow successful");
    } catch (error) {
      console.error('Error updating follow status:', error);
      Alert.alert("Error", "Something went wrong while updating follow status.");
    }
  };

  const navigateToUserProfile = () => {
    if (post && post.userId) {
      router.push(`/UserProfile?uid=${post.userId}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <Text>Post not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* User Profile Section */}
      {post.userId && (
        <View style={styles.userContainer}>
          <View style={styles.userProfileRow}>
            {/* Profile picture and username container */}
            <View style={styles.profileSection}>
              <TouchableOpacity 
                onPress={navigateToUserProfile} 
                style={styles.profileTouchable}
              >
                <Image 
                  source={{ 
                    uri: authorProfilePicture || '../photos/defaultpfp.png' 
                  }} 
                  style={styles.userImage} 
                />
                <Text style={styles.username}>{authorUsername || "Loading..."}</Text>
              </TouchableOpacity>
            </View>
            
            {/* Follow Button - positioned to the right */}
            {currentUser && currentUser.uid !== post.userId && (
              <TouchableOpacity 
                onPress={handleFollow}
                style={[
                  styles.followButton,
                  isFollowing ? styles.followingButton : {}
                ]}
              >
                <Text style={[
                  styles.followButtonText,
                  isFollowing ? styles.followingButtonText : {}
                ]}>
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Post Content */}
      {post.mediaUrl && (
        <Image source={{ uri: post.mediaUrl }} style={styles.postImage} />
      )}
      
      {/* Social Interaction Buttons */}
      <View style={styles.socialButtons}>
        <TouchableOpacity onPress={handleLike} style={styles.socialButton}>
          {isLiked ? <Likesfill width={30} height={30} fill="#FF4B4B" /> : <Likes width={30} height={30} fill="#000000" />}
          <Text style={styles.socialButtonText}>{likes.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setCommentModalVisible(true)} style={styles.socialButton}>
          <Comments width={28} height={28} fill="none" stroke='black' strokeWidth="1.2" />
          <Text style={styles.socialButtonText}>{comments.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} style={styles.socialButton}>
          <ShareIcon width={28} height={28} fill="none" />
        </TouchableOpacity>
      </View>

      <Text style={styles.caption}>{post.caption}</Text>
      <Text style={styles.timestamp}>{post.createdAt && new Date(post.createdAt.seconds * 1000).toLocaleString()}</Text>
      
      {/* Comments Section */}
      <View style={styles.commentsSection}>
        <Text style={styles.commentsHeader}>Comments</Text>
        {comments.length === 0 ? (
          <Text style={styles.noCommentsText}>No comments yet</Text>
        ) : (
          comments.slice(0, 3).map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <Text style={styles.commentUsername}>{comment.username}</Text>
              <Text style={styles.commentText}>{comment.text}</Text>
            </View>
          ))
        )}
        {comments.length > 3 && (
          <TouchableOpacity onPress={() => setCommentModalVisible(true)}>
            <Text style={styles.viewAllComments}>View all {comments.length} comments</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Unfollow Confirmation Modal */}
      <Modal
        visible={unfollowModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setUnfollowModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.unfollowModalContainer}>
            <Text style={styles.unfollowModalTitle}>Unfollow User</Text>
            <Text style={styles.unfollowModalText}>
              Are you sure you want to unfollow {authorUsername}?
            </Text>
            <View style={styles.unfollowModalButtons}>
              <TouchableOpacity 
                style={[styles.unfollowModalButton, styles.unfollowModalCancelButton]} 
                onPress={() => setUnfollowModalVisible(false)}
              >
                <Text style={styles.unfollowModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.unfollowModalButton, styles.unfollowModalConfirmButton]} 
                onPress={handleUnfollow}
              >
                <Text style={styles.unfollowModalConfirmText}>Unfollow</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Comments Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Text style={styles.commentUsername}>{item.username}</Text>
                  <Text style={styles.commentText}>{item.text}</Text>
                </View>
              )}
              style={styles.commentsList}
            />

            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              <TouchableOpacity
                style={[styles.commentButton, !newComment.trim() && styles.commentButtonDisabled]}
                onPress={handleComment}
                disabled={!newComment.trim()}
              >
                <Text style={styles.commentButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
  },
  postImage: {
    width: "100%",
    height: 300,
    marginBottom: 12,
    resizeMode: "cover",
    borderRadius: 10,
  },
  caption: {
    fontSize: 16,
    marginBottom: 8,
    marginTop: 10,
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
    marginBottom: 15,
  },
  userContainer: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  userProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
    color: '#000',
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#E8E8E8',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#333',
  },
  socialButtons: {
    flexDirection: 'row',
    marginTop: 5,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  socialButtonText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentsSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  noCommentsText: {
    color: '#666',
    fontStyle: 'italic',
  },
  commentItem: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentUsername: {
    fontWeight: 'bold',
    marginBottom: 3,
  },
  commentText: {
    color: '#333',
  },
  viewAllComments: {
    color: '#666',
    marginTop: 5,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
  },
  commentsList: {
    maxHeight: '60%',
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  commentButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  commentButtonDisabled: {
    backgroundColor: '#ccc',
  },
  commentButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  unfollowModalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignSelf: 'center',
  },
  unfollowModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  unfollowModalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  unfollowModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  unfollowModalButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  unfollowModalCancelButton: {
    backgroundColor: '#f0f0f0',
  },
  unfollowModalConfirmButton: {
    backgroundColor: '#FF3B30',
  },
  unfollowModalCancelText: {
    color: '#333',
    fontWeight: '600',
  },
  unfollowModalConfirmText: {
    color: 'white',
    fontWeight: '600',
  },
}); 