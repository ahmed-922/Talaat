import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

export default function UserProfile() {
  const router = useRouter();
  const { uid } = useLocalSearchParams(); // The "uid" in the route parameter

  // Current user (from Firebase Auth)
  const [currentUser, setCurrentUser] = useState<any>(null);
  // Firestore doc ID for the current user
  const [currentUserDocId, setCurrentUserDocId] = useState<string | null>(null);

  // Target user's data (the profile we're visiting)
  const [userData, setUserData] = useState<any>(null);
  // Loading state
  const [loading, setLoading] = useState(true);

  // Follow/Unfollow states
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  // Posts count for the viewed user
  const [postsCount, setPostsCount] = useState(0);

  /**
   * 1) Listen for Auth changes to get the current user.
   *    If not logged in, redirect to /login.
   */
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
      } else {
        setCurrentUser(user);
        setCurrentUserDocId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  /**
   * 3) If the route's uid is the same as currentUser.uid, redirect to /user.
   */
  useEffect(() => {
    if (currentUser && uid === currentUser.uid) {
      router.replace("/user");
    }
  }, [currentUser, uid]);

  /**
   * 4) Fetch the target user's Firestore doc (by searching where("uid", "==", uid))
   */
  useEffect(() => {
    if (!currentUser) return; // wait for currentUser
    if (!uid) {
      setLoading(false);
      return;
    }
    if (uid === currentUser.uid) return; // already handled redirect

    const fetchUser = async () => {
      setLoading(true);
      try {
        // First try to get the user document directly by ID
        const userDocRef = doc(db, "users", uid as string);
        const userDocSnapshot = await getDoc(userDocRef);
        
        if (userDocSnapshot.exists()) {
          const data = userDocSnapshot.data();
          
          // Store the doc ID for the visited user
          setUserData({
            ...data,
            docId: uid,
          });
          
          // Instead of data.followersCount, we use the actual array length:
          setFollowersCount(data.followers?.length || 0);
          setFollowingCount(data.followingCount || 0);
          // Optionally, use stored postsCount as a starting value
          setPostsCount(data.postsCount || 0);
          
          // Check if current user is in the target user's followers array
          setIsFollowing(data.followers?.includes(currentUser.uid));
        } else {
          // Fallback to legacy query if direct lookup fails
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("uid", "==", uid));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const data = userDoc.data();

            // Store the doc ID for the visited user
            const docId = userDoc.id;
            setUserData({
              ...data,
              docId: docId,
            });

            // Instead of data.followersCount, we use the actual array length:
            setFollowersCount(data.followers?.length || 0);
            setFollowingCount(data.followingCount || 0);
            // Optionally, use stored postsCount as a starting value
            setPostsCount(data.postsCount || 0);

            // Check if current user is in the target user's followers array
            setIsFollowing(data.followers?.includes(currentUser.uid));
          } else {
            setUserData(null);
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [uid, currentUser]);

  /**
   * 5) Fetch and count total posts of the viewed user
   */
  useEffect(() => {
    if (!userData) return;

    const fetchPostsCount = async () => {
      try {
        const postsRef = collection(db, "posts");
        const postsQuery = query(postsRef, where("byUser", "==", userData.docId));
        const postsSnapshot = await getDocs(postsQuery);
        setPostsCount(postsSnapshot.docs.length);
      } catch (error) {
        console.error("Error fetching posts count:", error);
      }
    };

    fetchPostsCount();
  }, [userData]);

  /**
   * 6) Follow / Unfollow:
   *    - We update BOTH the target user's doc (followers)
   *      AND the current user's doc (following).
   */
  const handleFollowToggle = async () => {
    if (!userData?.docId) return;
    if (!currentUserDocId) return;

    try {
      const targetUserRef = doc(db, "users", userData.docId);
      const currentUserRef = doc(db, "users", currentUserDocId);

      if (isFollowing) {
        // UNFOLLOW: Remove current user from target's followers and target from current user's following
        await updateDoc(targetUserRef, {
          followers: arrayRemove(currentUserDocId),
        });
        await updateDoc(currentUserRef, {
          following: arrayRemove(userData.docId),
        });

        // Update local UI states
        setIsFollowing(false);
        setFollowersCount((prev) => prev - 1);
      } else {
        // FOLLOW: Add current user to target's followers and target to current user's following
        await updateDoc(targetUserRef, {
          followers: arrayUnion(currentUserDocId),
        });
        await updateDoc(currentUserRef, {
          following: arrayUnion(userData.docId),
        });

        // Update local UI states
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong while updating follow status.");
      console.error(error);
    }
  };

  /**
   * 7) Message button logic
   */
  const handleMessage = () => {
    if (!userData?.docId || !currentUser) {
      Alert.alert('Error', 'Cannot start chat at this time');
      return;
    }
    // Use the correct path format for Expo Router
    router.push({
      pathname: '/messages',
      params: { recipientId: userData.docId }
    });
  };

  /**
   * 8) Plus button logic (placeholder)
   */
  const handlePlus = () => {
    Alert.alert("Plus Pressed", "Navigate to create a post, etc.");
  };

  // Show loading spinner
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // If user not found in Firestore
  if (!userData) {
    return (
      <View style={styles.container}>
        <Text>User not found.</Text>
      </View>
    );
  }

  // Render the visited user's profile
  return (
    <View style={styles.container}>
      {/* Profile Picture */}
      {userData.profilePicture ? (
        <Image
          source={{ uri: userData.profilePicture }}
          style={styles.profilePic}
        />
      ) : (
        <Text style={{ fontStyle: "italic" }}>No Profile Picture</Text>
      )}

      {/* Username & Bio */}
      <Text style={styles.username}>{userData.username}</Text>
      <Text style={styles.bio}>{userData.bio || "No bio available"}</Text>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{postsCount}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{followersCount}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{followingCount}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      {/* Buttons Row */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[
            styles.baseFollowButton,
            isFollowing && styles.followingButton,
            !isFollowing && styles.notFollowingButton,
          ]}
          onPress={handleFollowToggle}
        >
          <Text style={styles.followButtonText}>
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleMessage}>
          <Text style={styles.buttonText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.plusButton} onPress={handlePlus}>
          <Text style={styles.plusButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Posts Section */}
      <View style={{ marginTop: 30 }}>
        <Text style={styles.postsHeader}>Posts</Text>
        <Text>
          {userData.username} have {postsCount} posts
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  username: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  bio: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 15,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    color: "#555",
  },
  buttonsRow: {
    flexDirection: "row",
    marginVertical: 10,
    alignItems: "center",
  },
  baseFollowButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: "#aaa",
  },
  notFollowingButton: {
    backgroundColor: "#007bff",
  },
  followButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  plusButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#007AFF",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  plusButtonText: {
    fontSize: 24,
    color: "#007AFF",
    lineHeight: 28,
  },
  postsHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
});