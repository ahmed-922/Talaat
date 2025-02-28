import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { Link } from "expo-router";

interface Story {
  id: string;
  userId: string;
  imageUrl: string;
  createdAt: any;
}

const Stories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState({ photoURL: "", username: "" });
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const now = new Date();
        const expiryTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const q = query(collection(db, "stories"), where("createdAt", ">", expiryTime));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Story[];
        setStories(data);
      } catch (error) {
        console.error("Error fetching stories:", error);
      }
    };
    fetchStories();
  }, []);

  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      if (currentUser?.uid) {
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUserProfile({
            photoURL: userData?.profilePicture || "../photos/defaultpfp.png",
            username: "Your Story",
          });
        }
      }
    };
    fetchCurrentUserProfile();
  }, [currentUser]);

  const groupedStories = stories.reduce((acc, story) => {
    if (!acc[story.userId]) {
      acc[story.userId] = [];
    }
    acc[story.userId].push(story);
    return acc;
  }, {} as { [key: string]: Story[] });

  return (
    <View style={styles.container}>
      <FlatList
        data={[{ id: "currentUser", userId: currentUser?.uid, imageUrl: currentUserProfile.photoURL, username: currentUserProfile.username }, ...Object.values(groupedStories)]}
        renderItem={({ item }) =>
          item.id === "currentUser" ? (
            <Link href="../../(pages)/addStory" asChild>
              <TouchableOpacity style={styles.storyItem}>
                <Image source={{ uri: item.imageUrl }} style={styles.storyImage} />
                <Text style={styles.storyUsername}>{item.username}</Text>
              </TouchableOpacity>
            </Link>
          ) : (
            <StoryItem item={item} />
          )
        }
        keyExtractor={(item) => item.id || item[0].id}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const StoryItem = ({ item }: { item: Story[] }) => {
  const [username, setUsername] = useState("Loading...");

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const userRef = doc(db, "users", item[0].userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUsername(userData?.username || "Unknown");
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    };
    fetchUsername();
  }, [item]);

  return (
    <Link href={`../../(pages)/viewStory?id=${item[0].id}`} asChild>
      
      <TouchableOpacity style={styles.storyItem}>
        <View style={styles.border}>
         <Image source={{ uri: item[0].imageUrl }} style={styles.storyImage} />
         </View>
        <Text style={styles.storyUsername}>{username}</Text>
      </TouchableOpacity>
     
    </Link>
  );
};

export default Stories;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  storyItem: {
    alignItems: "center",
    marginHorizontal: 10,
  },
  storyImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    
  },
  border: {
    borderWidth: 2,
    borderRightColor: "red",
    borderBottomColor: "red",
    borderLeftColor: "gray",
    borderTopColor: "gray",
    borderRadius: 40,
    padding: 2,
  },

  storyUsername: {
    marginTop: 5,
    fontSize: 12,
    textAlign: "center",
  },
});
