import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router"; // Use useLocalSearchParams instead
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export default function ViewStory() {
  const [story, setStory] = useState<any>(null);
  const { id } = useLocalSearchParams(); // Access the id parameter

  useEffect(() => {
    const fetchStory = async () => {
      if (!id) return;
      try {
        // Direct document reference using docId
        const storyRef = doc(db, "stories", id as string);
        const storyDoc = await getDoc(storyRef);
        if (storyDoc.exists()) {
          setStory(storyDoc.data());
        }
      } catch (error) {
        console.error("Error fetching story:", error);
      }
    };
    fetchStory();
  }, [id]);

  if (!story) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: story.imageUrl }} style={styles.image} />
      <Text style={styles.username}>{story.username}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "80%",
  },
  username: {
    fontSize: 20,
    marginTop: 10,
  },
});
