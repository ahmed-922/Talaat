import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { Link } from "expo-router";

interface Story {
  id: string;
  userId: string;
  imageUrl: string;
  username: string;
}

const Stories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState({ photoURL: "", username: "" });
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const snapshot = await getDocs(collection(db, "stories"));
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

  const renderStory = ({ item }: { item: Story }) => (
    <Link href={`../../(pages)/viewStory?id=${item.id}`} asChild>
      <TouchableOpacity style={styles.storyItem}>
        <Image source={{ uri: item.imageUrl }} style={styles.storyImage} />
        <Text style={styles.storyUsername}>{item.username}</Text>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={[{ id: "currentUser", userId: currentUser?.uid, imageUrl: currentUserProfile.photoURL, username: currentUserProfile.username }, ...stories]}
        renderItem={({ item }) =>
          item.id === "currentUser" ? (
            <Link href="../../(pages)/addStory" asChild>
              <TouchableOpacity style={styles.storyItem}>
                <Image source={{ uri: item.imageUrl }} style={styles.storyImage} />
                <Text style={styles.storyUsername}>{item.username}</Text>
              </TouchableOpacity>
            </Link>
          ) : (
            renderStory({ item })
          )
        }
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
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
    borderWidth: 2,
    borderColor: "red",
  },
  storyUsername: {
    marginTop: 5,
    fontSize: 12,
    textAlign: "center",
  },
});
