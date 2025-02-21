import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from "react-native";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { Link } from "expo-router";

const Trends = () => {
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchTrendingPosts = async () => {
      try {
        const q = query(collection(db, "posts"), orderBy("likes", "desc"), limit(10));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setTrendingPosts(data);
      } catch (error) {
        console.error("Error fetching trending posts:", error);
      }
    };

    fetchTrendingPosts();
  }, []);

  const renderPost = ({ item }: { item: any }) => (
    <View style={styles.postContainer}>
      <Link href={`../(pages)/PostDetail?postId=${item.id}`} style={styles.linkWrapper}>
        <Image source={{ uri: item.img }} style={styles.postImage} />
        <Text style={styles.caption}>{item.caption}</Text>
        <Text style={styles.likesCount}>{item.likes?.length || 0} likes</Text>
      </Link>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Trending Posts</Text>
      <FlatList
        data={trendingPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 16,
    alignSelf: "center",
    color: "#333",
  },
  postContainer: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 10,
  },
  linkWrapper: {
    flexDirection: "column",
    alignItems: "center",
  },
  postImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
    marginBottom: 8,
  },
  caption: {
    fontSize: 16,
    marginBottom: 4,
    textAlign: "center",
  },
  likesCount: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});

export default Trends;
