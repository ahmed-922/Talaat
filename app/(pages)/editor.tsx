import React, { useState, useEffect } from "react";
import { View, Text, Image, Button, StyleSheet, TouchableOpacity, Animated, Dimensions, PanResponder } from "react-native";
import { Video } from "expo-av";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function Editor() {
  const { uri, type } = useLocalSearchParams();
  const router = useRouter();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const screenHeight = Dimensions.get("window").height;
  const editorHeight = useState(new Animated.Value(0))[0]; // Initial height for closed state

  const handleSave = () => {
    // Navigate to sd.tsx with the edited file URI
    router.push({
      pathname: "/sd",
      params: { uri, type },
    });
  };

  const handleCancel = () => {
    // Navigate back to the previous screen
    router.back();
  };

  const toggleEditor = () => {
    setIsEditorOpen(!isEditorOpen);
  };

  useEffect(() => {
    Animated.timing(editorHeight, {
      toValue: isEditorOpen ? screenHeight * 0.3 : 0, // Adjust height based on editor state
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isEditorOpen]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      editorHeight.setValue(Math.max(0, screenHeight * 0.3 - gestureState.dy));
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 50) {
        setIsEditorOpen(false);
      } else {
        setIsEditorOpen(true);
      }
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.mediaContainer}>
        {type === "image" ? (
          <Image source={{ uri }} style={styles.media} />
        ) : (
          <Video source={{ uri }} style={styles.media} useNativeControls />
        )}
      </View>
      {type === "video" && (
        <Animated.View style={[styles.editor, { height: editorHeight }]}>
          <View {...panResponder.panHandlers} style={styles.dragHandle} />
          <View style={styles.editorContent}>
            <Text>Video Editor (not implemented)</Text>
            {/* Add video editing controls here */}
          </View>
        </Animated.View>
      )}
      <View style={styles.buttonContainer}>
        <Button title="Cancel" onPress={handleCancel} />
        <Button title="Save" onPress={handleSave} />
      </View>
      <View style={styles.floatingBar}>
        {type === "video" && (
          <TouchableOpacity style={styles.floatingButton} onPress={toggleEditor}>
            <Text style={styles.floatingButtonText}>{isEditorOpen ? "Close Editor" : "Open Editor"}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.floatingButton}>
          <Text style={styles.floatingButtonText}>T</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.floatingButton}>
          <Text style={styles.floatingButtonText}>🎨</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#000",
  },
  mediaContainer: {
    width: "100%",
    height: "100%",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  buttonContainer: {
    width: "100%",
    backgroundColor: "#fff",
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    height: 160,
  },
  floatingBar: {
    position: "absolute",
    right: 10,
    top: 100,
    alignItems: "center",
  },
  floatingButton: {
    backgroundColor: "transparent",
    borderRadius: 25,
    padding: 10,
    marginBottom: 10,
    elevation: 5,
  },
  floatingButtonText: {
    fontSize: 20,
    color: "#000",
  },
  editor: {
    width: "100%",
    backgroundColor: "#f0f0f0",
    position: "absolute",
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  dragHandle: {
    width: "100%",
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ccc",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  editorContent: {
    padding: 20,
  },
});
