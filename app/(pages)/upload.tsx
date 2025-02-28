import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Image } from "react-native";
import { Video } from "expo-av";
import { useRouter, useLocalSearchParams } from "expo-router";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth } from "../../firebaseConfig";

export default function Sd() {
  const { uri, type } = useLocalSearchParams();
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const router = useRouter();
  const currentUser = auth.currentUser;

  const handleUpload = async () => {
    if (!uri || !currentUser) return;

    try {
      // Upload media to Firebase Storage
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const storageRef = ref(storage, `${type === "image" ? "posts" : "videos"}/${currentUser.uid}/${Date.now()}`);
      await uploadBytes(storageRef, blob);
      const mediaUrl = await getDownloadURL(storageRef);

      // Save post to Firestore
      await addDoc(collection(db, type === "image" ? "posts" : "videos"), {
        userId: currentUser.uid,
        mediaUrl: mediaUrl,
        caption: caption,
        hashtags: hashtags.split(" ").filter(Boolean),
        createdAt: serverTimestamp(),
      });
      alert("Post uploaded successfully!");
      router.push("/");
    } catch (error) {
      console.error("Error uploading post:", error);
    }
  };

  return (
    <View style={styles.container}>
      {type === "image" ? (
        <Image source={{ uri }} style={styles.media} />
      ) : (
        <Video source={{ uri }} style={styles.media} useNativeControls />
      )}
      <TextInput
        style={styles.input}
        placeholder="Add a caption..."
        value={caption}
        onChangeText={setCaption}
      />
      <TextInput
        style={styles.input}
        placeholder="Add hashtags..."
        value={hashtags}
        onChangeText={setHashtags}
      />
      <View style={styles.Buttons}>
      <Button title="Cancel" onPress={() => router.back()} />
      <Button title="Upload" onPress={handleUpload} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  media: {
    width: "100%",
    height: 300,
    marginBottom: 20,
    borderRadius: 5,
  },
  input: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 20,
  },
  Buttons : {
    flexDirection: 'row',
  }
});
