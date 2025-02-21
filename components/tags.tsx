// components/tags.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Adjust the path as needed
import Hashtag from './svgs/hashtags'

export default function Tags() {
  const [modalVisible, setModalVisible] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Function to fetch hashtags from the "posts" collection in Firestore
  const fetchHashtags = async () => {
    setLoading(true);
    try {
      const postsRef = collection(db, 'posts');
      const postsSnapshot = await getDocs(postsRef);

      // Count each hashtag's occurrences
      const hashtagCount: { [tag: string]: number } = {};
      postsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.hashtags && Array.isArray(data.hashtags)) {
          data.hashtags.forEach((tag: string) => {
            // Ensure the hashtag has a '#' prefix
            const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
            hashtagCount[normalizedTag] = (hashtagCount[normalizedTag] || 0) + 1;
          });
        }
      });

      // Convert counts into an array, sort descending by usage, and take the top 10
      const topHashtags = Object.entries(hashtagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag);

      setHashtags(topHashtags);
    } catch (error) {
      console.error('Error fetching hashtags:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch hashtags when the modal becomes visible
  useEffect(() => {
    if (modalVisible) {
      fetchHashtags();
    }
  }, [modalVisible]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
       <View style={{flexDirection: 'row', justifyContent: 'center'}}><Text style={styles.buttonText}><Hashtag/></Text><Text style={styles.buttonText}>BH</Text></View>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.card}>
            <Text style={styles.title}>Top 10 Hashtags</Text>

            {loading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : hashtags.length > 0 ? (
              hashtags.map((tag, index) => (
                <Text key={index} style={styles.hashtag}>
                  {tag}
                </Text>
              ))
            ) : (
              <Text>No hashtags found</Text>
            )}

            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
   verticalAlign: 'middle',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '70%',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingTop: 20,
    alignItems: 'center',
    bottom: 0,
    margin: 0
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  hashtag: {
    fontSize: 16,
    marginVertical: 2,
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#888',
    borderRadius: 6,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
