import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image, 
} from "react-native";
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { Link } from "expo-router"; 
import { db, auth } from "../../firebaseConfig";

const Search = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserDocId, setCurrentUserDocId] = useState("");

  useEffect(() => {
    // Fetch users from Firestore
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const usersData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setUsers(usersData);
    };

    // Listen for auth changes
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchCurrentUserDocId(user);
      }
    });

    fetchUsers();
    return unsubscribe; // Cleanup on unmount
  }, []);

  const fetchCurrentUserDocId = async (user: any) => {
    const q = query(collection(db, "users"), where("uid", "==", user.uid));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      setCurrentUserDocId(snapshot.docs[0].id);
    }
  };

  const handleFollow = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    if (!currentUser) return;

    // References to Firestore documents
    const targetUserRef = doc(db, "users", targetUserId);
    const currentUserRef = doc(db, "users", currentUserDocId);

    if (isCurrentlyFollowing) {
      // Unfollow
      await updateDoc(targetUserRef, {
        followers: arrayRemove(currentUser.uid),
      });
      await updateDoc(currentUserRef, {
        following: arrayRemove(targetUserId),
      });
    } else {
      // Follow
      await updateDoc(targetUserRef, {
        followers: arrayUnion(currentUser.uid),
      });
      await updateDoc(currentUserRef, {
        following: arrayUnion(targetUserId),
      });
    }

    // Update local state to reflect changes
    setUsers((prevUsers) =>
      prevUsers.map((user) => {
        if (user.id === targetUserId) {
          const updatedFollowers = isCurrentlyFollowing
            ? user.followers?.filter((id: string) => id !== currentUser.uid)
            : [...(user.followers || []), currentUser.uid];
          return { ...user, followers: updatedFollowers };
        }
        return user;
      })
    );
  };

  // Filter users by search text
  const filteredUsers = users.filter((user) =>
    user.username?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Search Users</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Type a username..."
        value={searchText}
        onChangeText={setSearchText}
      />

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isCurrentUser = item.uid === currentUser?.uid;
          const isFollowing = item.followers?.includes(currentUser?.uid);

          return (
            <View style={styles.userItem}>
              <Link
                href={`/UserProfile?uid=${item.uid}`}
                style={styles.linkWrapper}
              >
                <Image
                  source={{ uri: item.profilePicture }}
                  style={styles.profilePic}
                />
                <Text style={styles.username}>@{item.username}</Text>
              </Link>
              <TouchableOpacity
                disabled={isCurrentUser}
                onPress={() => handleFollow(item.id, !!isFollowing)}
                style={[
                  styles.baseFollowButton,
                  isCurrentUser && styles.disabledButton,
                  !isCurrentUser && isFollowing && styles.followingButton,
                  !isCurrentUser && !isFollowing && styles.notFollowingButton,
                ]}
              >
                <Text style={styles.followButtonText}>
                  {isCurrentUser
                    ? "That's you"
                    : isFollowing
                    ? "Following"
                    : "Follow"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
};

// ---------------- STYLES ---------------- //
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 16,
    alignSelf: "center",
    color: "#333",
  },
  searchInput: {
    height: 45,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  linkWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profilePic: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    marginRight: 12,
    backgroundColor: "#e1e1e1",
  },
  username: {
    fontSize: 18,
    color: "#333",
  },
  baseFollowButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: "#ccc",
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
});

export default Search;
