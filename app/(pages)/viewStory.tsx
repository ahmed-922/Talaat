import React, { useEffect, useState, useRef } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, Dimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export default function ViewStory() {
  const [stories, setStories] = useState<any[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const { id } = useLocalSearchParams();
  const timer = useRef<Animated.Value>(new Animated.Value(0)).current;
  const intervalRef = useRef<any>(null);
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    const fetchStories = async () => {
      if (!id) return;
      try {
        const storyRef = doc(db, "stories", id as string);
        const storyDoc = await getDoc(storyRef);
        if (storyDoc.exists()) {
          const storyData = storyDoc.data();
          const userStoriesQuery = query(
            collection(db, "stories"),
            where("userId", "==", storyData.userId),
            where("createdAt", ">", new Date(new Date().getTime() - 24 * 60 * 60 * 1000))
          );
          const userStoriesSnapshot = await getDocs(userStoriesQuery);
          const userStories = userStoriesSnapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          setStories(userStories);
        }
      } catch (error) {
        console.error("Error fetching stories:", error);
      }
    };
    fetchStories();
  }, [id]);

  useEffect(() => {
    if (stories.length > 0) {
      startTimer();
    }
    return () => clearInterval(intervalRef.current);
  }, [stories, currentStoryIndex]);

  const startTimer = () => {
    Animated.timing(timer, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        goToNextStory();
      }
    });
  };

  const goToNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      timer.setValue(0);
      startTimer();
    } else {
      router.back(); // Close the story view or navigate back
    }
  };

  const goToPreviousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      timer.setValue(0);
      startTimer();
    }
  };

  const handlePressIn = () => {
    timer.stopAnimation();
  };

  const handlePressOut = () => {
    startTimer();
  };

  if (stories.length === 0) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const currentStory = stories[currentStoryIndex];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.storyContainer}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={(e) => {
          const { locationX } = e.nativeEvent;
          if (locationX < screenWidth / 2) {
            goToPreviousStory();
          } else {
            goToNextStory();
          }
        }}
      >
        <Image source={{ uri: currentStory.imageUrl }} style={styles.image} />
        <Text style={styles.username}>{currentStory.username}</Text>
        <Text style={styles.storyCount}>{`${currentStoryIndex + 1} / ${stories.length}`}</Text>
        <Animated.View style={[styles.timer, { width: timer.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
      </TouchableOpacity>
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
  storyContainer: {
    width: "100%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  username: {
    fontSize: 20,
    marginTop: 10,
    position: "absolute",
    bottom: 10,
    left: 10,
    color: "#fff",
  },
  storyCount: {
    fontSize: 16,
    position: "absolute",
    top: 10,
    right: 10,
    color: "#fff",
  },
  timer: {
    height: 5,
    backgroundColor: "red",
    position: "absolute",
    top: 0,
    left: 0,
  },
});
