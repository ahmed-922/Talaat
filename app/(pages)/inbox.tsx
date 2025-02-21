import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  arrayRemove,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { Swipeable } from "react-native-gesture-handler";

const Inbox = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  // We'll keep track of the previous followers array (list of follower UIDs)
  const [prevFollowers, setPrevFollowers] = useState<string[]>([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, "users", currentUser.uid);
    const unsubscribe = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const currentFollowers: string[] = data.followers || [];

        // On first load, store the current followers and do not create notifications.
        if (prevFollowers.length === 0) {
          setPrevFollowers(currentFollowers);
        } else {
          // Identify new follower IDs
          const newFollowerIds = currentFollowers.filter(
            (fid) => !prevFollowers.includes(fid)
          );
          if (newFollowerIds.length > 0) {
            // For each new follower, fetch details and add a notification.
            for (const followerId of newFollowerIds) {
              const followerDoc = await getDoc(doc(db, "users", followerId));
              if (followerDoc.exists()) {
                const followerData = followerDoc.data();
                const notification = {
                  id: `follow_${followerId}_${Date.now()}`,
                  message: `${followerData.username} followed you`,
                  profilePicture: followerData.profilePicture || null,
                  username: followerData.username,
                  type: "follow",
                };
                await updateDoc(userRef, {
                  notifications: arrayUnion(notification),
                });
              }
            }
          }
          // Update our local prevFollowers list.
          setPrevFollowers(currentFollowers);
        }

        // Update local notifications state.
        setNotifications(data.notifications || []);
      }
    });

    return () => unsubscribe();
  }, [currentUser, prevFollowers]);

  const handleDeleteNotification = async (notificationId: string) => {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    // Find the full notification object (arrayRemove requires an exact match)
    const notificationToRemove = notifications.find((n) => n.id === notificationId);
    if (!notificationToRemove) return;
    try {
      await updateDoc(userRef, {
        notifications: arrayRemove(notificationToRemove),
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const renderNotification = ({ item }: { item: any }) => (
    <Swipeable
      renderRightActions={() => (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(item.id)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      )}
    >
      <View style={styles.notificationItem}>
        {item.profilePicture && (
          <Image source={{ uri: item.profilePicture }} style={styles.notificationPic} />
        )}
        <View style={styles.notificationContent}>
          <Text style={styles.notificationMessage}>{item.message}</Text>
        </View>
      </View>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Inbox</Text>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
      />
    </View>
  );
};

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
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  notificationPic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 16,
    color: "#333",
  },
  deleteButton: {
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderRadius: 10,
    marginBottom: 10,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default Inbox;
