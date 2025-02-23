import { useEffect, useState, useRef, useCallback } from 'react';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View, Button, FlatList, Dimensions, ScrollView, TouchableOpacity, Text, Platform, Modal, TextInput, Share, Image } from 'react-native';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { ViewToken } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Link, Stack } from 'expo-router';
import PlayIcon from '../../components/svgs/playIcon';
import Likes from '../../components/svgs/likes';
import Likesfill from '../../components/svgs/likesfill';
import Comments from '../../components/svgs/comments';
import ShareIcon from '../../components/svgs/share';

const { height, width } = Dimensions.get("window");

const VideoItem = ({ item, isVisible, playerRef }: { item: any, isVisible: boolean, playerRef: any }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [lastToggleTime, setLastToggleTime] = useState(0);
  const [likes, setLikes] = useState<string[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const currentUser = auth.currentUser;
  const [uploaderData, setUploaderData] = useState<any>(null);
  const [isPlayerMounted, setIsPlayerMounted] = useState(true);
  
  const player = useVideoPlayer(item.mediaUrl, async player => {
    if (!isPlayerMounted) return;
    try {
      player.loop = true;
      if (!isVisible) {
        await player.pause();
      }
    } catch (error) {
      console.error('Error initializing player:', error);
    }
  });

  useEffect(() => {
    setIsPlayerMounted(true);
    if (player && isPlayerMounted) {
      playerRef.current[item.id] = player;
    }
    
    return () => {
      setIsPlayerMounted(false);
      if (playerRef.current[item.id]) {
        try {
          const currentPlayer = playerRef.current[item.id];
          if (currentPlayer && typeof currentPlayer.pause === 'function') {
            currentPlayer.pause();
          }
        } catch (error) {
          console.error('Error cleaning up player:', error);
        }
        delete playerRef.current[item.id];
      }
    };
  }, [player, playerRef, item.id]);

  // Listen for likes and comments in real-time
  useEffect(() => {
    if (!item.id) return;

    const videoRef = doc(db, 'videos', item.id);
    const commentsRef = collection(db, 'videos', item.id, 'comments');
    const commentsQuery = query(commentsRef, orderBy('createdAt', 'desc'));

    const unsubscribeLikes = onSnapshot(videoRef, (doc) => {
      if (doc.exists()) {
        const videoData = doc.data();
        setLikes(videoData.likes || []);
        setIsLiked(currentUser && videoData.likes?.includes(currentUser.uid));
      }
    });

    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentsData);
    });

    return () => {
      unsubscribeLikes();
      unsubscribeComments();
    };
  }, [item.id, currentUser]);

  // Handle visibility changes
  useEffect(() => {
    let isMounted = true;
    
    const handleVisibility = async () => {
      if (!player || !isPlayerMounted || !isMounted) return;
      
      try {
        if (isVisible) {
          await player.pause();
          player.currentTime = 0;
          if (isMounted && isPlayerMounted) {
            await player.play();
            setIsPaused(false);
          }
        } else {
          if (isMounted && isPlayerMounted) {
            await player.pause();
            player.currentTime = 0;
          }
        }
      } catch (error) {
        console.error('Error handling video visibility:', error);
      }
    };

    handleVisibility();
    
    return () => {
      isMounted = false;
    };
  }, [isVisible, player, isPlayerMounted]);

  // Fetch uploader data
  useEffect(() => {
    if (!item.byUser) return;

    const fetchUploaderData = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', item.byUser));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setUploaderData(snapshot.docs[0].data());
        }
      } catch (error) {
        console.error('Error fetching uploader data:', error);
      }
    };

    fetchUploaderData();
  }, [item.byUser]);

  const togglePlayPause = async () => {
    if (!player || !isPlayerMounted) return;
    
    const now = Date.now();
    if (now - lastToggleTime < 500) return;

    try {
      if (player.playing) {
        await player.pause();
        setIsPaused(true);
      } else {
        await player.play();
        setIsPaused(false);
      }
      setLastToggleTime(now);
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const handleLike = async () => {
    if (!currentUser || !item.id) return;
    
    try {
      const videoRef = doc(db, 'videos', item.id);
      if (isLiked) {
        await updateDoc(videoRef, {
          likes: arrayRemove(currentUser.uid)
        });
      } else {
        await updateDoc(videoRef, {
          likes: arrayUnion(currentUser.uid)
        });
      }
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  const handleComment = async () => {
    if (!currentUser || !newComment.trim() || !item.id) return;

    try {
      const commentsRef = collection(db, 'videos', item.id, 'comments');
      await addDoc(commentsRef, {
        text: newComment,
        userId: currentUser.uid,
        username: currentUser.displayName || 'Anonymous',
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this video!`,
        url: item.mediaUrl
      });
    } catch (error) {
      console.error('Error sharing video:', error);
    }
  };

  return (
    <View style={styles.videoContainer}>
      <VideoView style={styles.fullscreenVideo} player={player} nativeControls={false} contentFit="contain" />
      <TouchableOpacity style={styles.videoOverlay} onPress={togglePlayPause} activeOpacity={1}>
        {isPaused && (
          <View style={styles.controlsContainer}>
            <Text style={styles.controlButtonText}><PlayIcon width={65} height={65} fill={'white'} opacity={1}/></Text>
          </View>
        )}
      </TouchableOpacity>

      {/* User Profile Button */}
      {item.byUser && (
        <Link href={`/UserProfile?uid=${item.byUser}`} asChild>
          <TouchableOpacity style={styles.userProfileButton}>
            <Image
              source={{ 
                uri: uploaderData?.profilePicture || '../photos/defaultpfp.png'
              }}
              style={styles.userProfileImage}
            />
          </TouchableOpacity>
        </Link>
      )}

      {/* Social Interaction Buttons */}
      <View style={styles.socialButtons}>
        <TouchableOpacity onPress={handleLike} style={styles.socialButton}>
          {isLiked ? <Likesfill width={28} height={28} fill="#FF4B4B" /> : <Likes width={28} height={28} fill="#FFFFFF" />}
          <Text style={styles.socialButtonText}>{likes.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setCommentModalVisible(true)} style={styles.socialButton}>
          <Comments width={28} height={28} fill="#FFFFFF" />
          <Text style={styles.socialButtonText}>{comments.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} style={styles.socialButton}>
          <ShareIcon width={28} height={28} fill="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Comments Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Text style={styles.commentUsername}>{item.username}</Text>
                  <Text style={styles.commentText}>{item.text}</Text>
                </View>
              )}
              style={styles.commentsList}
            />

            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              <TouchableOpacity
                style={[styles.commentButton, !newComment.trim() && styles.commentButtonDisabled]}
                onPress={handleComment}
                disabled={!newComment.trim()}
              >
                <Text style={styles.commentButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Add proper TypeScript interface for video data
interface VideoData {
  id: string;
  mediaUrl: string;
  byUser?: string;
  likes?: string[];
  [key: string]: any;
}

export default function VideoScreen() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [visibleItem, setVisibleItem] = useState<string | null>(null);
  const playerRef = useRef<{ [key: string]: any }>({});
  const flatListRef = useRef<FlatList>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && isMounted.current) {
      setVisibleItem(viewableItems[0].item.id);
    }
  }).current;

  useFocusEffect(
    useCallback(() => {
      let timeoutIds: NodeJS.Timeout[] = [];
      
      return () => {
        timeoutIds.forEach(id => clearTimeout(id));
        if (isMounted.current) {
          Object.values(playerRef.current).forEach(player => {
            try {
              const timeoutId = setTimeout(() => {
                if (player && typeof player.pause === 'function') {
                  player.pause();
                }
              }, 100);
              timeoutIds.push(timeoutId);
            } catch (error) {
              console.error('Error cleaning up player:', error);
            }
          });
        }
      };
    }, [])
  );

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'videos'));
        const videoData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as VideoData))
          .filter(doc => doc.mediaUrl);
        setVideos(videoData);
      } catch (error) {
        console.error('Error fetching videos:', error);
      }
    };
    fetchVideos();
  }, []);

  if (videos.length === 0) {
    return (
      <View style={styles.noVideosContainer}>
        <Text style={styles.noVideosText}>No videos available</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <Stack.Screen 
        options={{
          headerShown: false,
          contentStyle: { backgroundColor: 'black' },
          // This will hide the iOS scan button
          presentation: 'modal'
        }}
      />
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={({ item }) => (
          <View style={styles.videoWrapper}>
            <View style={styles.videoInnerWrapper}>
              <VideoItem item={item} isVisible={item.id === visibleItem} playerRef={playerRef} />
            </View>
          </View>
        )}
        keyExtractor={item => item.id}
        pagingEnabled
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate="fast"
        ListFooterComponent={() => (
          <View style={styles.endOfListContainer}>
            <Text style={styles.endOfListText}>End of videos</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "black",
    height: height,
    width: width,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoWrapper: {
    height: height,
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInnerWrapper: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
  },
  videoContainer: {
    height: height,
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenVideo: {
    height: "100%",
    width: "100%",
    backgroundColor: 'black',
  },
  controlsContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 24,
  },
  shareButtonText: {
    color: "white",
    marginTop: 5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
    opacity: 0.3,
  },
  shareButtonContainer: {
    position: "absolute",
    bottom: 50,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
    borderRadius: 5,
  },
  shareButtonImage: {
    width: 20,
    height: 20,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  noVideosContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  noVideosText: {
    color: 'white',
    fontSize: 18,
  },
  endOfListContainer: {
    height: 50,
    alignItems: 'center',
    backgroundColor: 'black',
  },
  endOfListText: {
    color: 'white',
    fontSize: 16,
  },
  socialButtons: {
    position: 'absolute',
    right: 10,
    bottom: 80,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  socialButton: {
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 20,
    padding: 8,
    width: 45,
    height: 55,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  socialButtonText: {
    color: '#FFFFFF',
    marginTop: 5,
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
  },
  commentsList: {
    maxHeight: '60%',
  },
  commentItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  commentUsername: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  commentText: {
    color: '#333',
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  commentButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  commentButtonDisabled: {
    backgroundColor: '#ccc',
  },
  commentButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  userProfileButton: {
    position: 'absolute',
    right: 10,
    bottom: 310,
    width: 45,
    height: 45,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 10,
  },
  userProfileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
});
