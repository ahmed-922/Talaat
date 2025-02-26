import { useEffect, useState, useRef, useCallback } from 'react';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View, Button, FlatList, Dimensions, ScrollView, TouchableOpacity, Text, Platform, Modal, TextInput, Share, Image } from 'react-native';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, onSnapshot, query, orderBy, where, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { ViewToken } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Link, Stack } from 'expo-router';
import PlayIcon from '../../components/svgs/playIcon';
import Likes from '../../components/svgs/likesfill';
import Comments from '../../components/svgs/comments';
import ShareIcon from '../../components/svgs/share';
import EyeOutlineIcon from '../../components/svgs/location';
import Vinyl from '../../components/svgs/vinyl';

// Rename the import to match how it's used in the component
const LocationIcon = EyeOutlineIcon;

function timeAgo(date: Date) {
  const now = new Date();
  const secondsElapsed = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (secondsElapsed < 60) {
    return "Just now";
  }

  const minutes = Math.floor(secondsElapsed / 60);
  if (minutes < 60) {
    return minutes === 1 ? "1m ago" : `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? "1h ago" : `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return days === 1 ? "1d ago" : `${days}d ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return weeks === 1 ? "1w ago" : `${weeks}w ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return months === 1 ? "1mo ago" : `${months}mo ago`;
  }

  const years = Math.floor(months / 12);
  return years === 1 ? "1y ago" : `${years}y ago`;
}

function formatTime(date: Date) {
  // 24-hour format with seconds
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// --- Component to Display the Post Timestamp ---

function PostTimestamp({ createdAt }: { createdAt: any }) {
  if (!createdAt || typeof createdAt.toDate !== "function") return null;
  const date = createdAt.toDate();
  return (
    <Text style={styles.timestamp}>
      {timeAgo(date)} at {formatTime(date)}
    </Text>
  );
}

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
  const [uploaderUsername, setUploaderUsername] = useState('');
  const [videoDate, setVideoDate] = useState('');
  const [caption, setCaption] = useState('');
  const [extraText, setExtraText] = useState('');
  const [isPlayerMounted, setIsPlayerMounted] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
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

    const unsubscribeComments = onSnapshot(commentsQuery, async (snapshot) => {
      try {
        const commentsWithUserData = await Promise.all(
          snapshot.docs.map(async (commentDoc) => {
            const commentData = commentDoc.data();
            
            if (!commentData || !commentData.userId) {
              console.log("Missing comment data:", commentDoc.id);
              return null;
            }

            try {
              const userRef = doc(db, "users", commentData.userId);
              const userSnap = await getDoc(userRef);
              
              if (userSnap.exists()) {
                const userData = userSnap.data();
                return {
                  id: commentDoc.id,
                  text: commentData.text || '',
                  userId: commentData.userId,
                  createdAt: commentData.createdAt,
                  user: {
                    username: userData.username || "Unknown User",
                    profilePicture: userData.profilePicture || "../photos/defaultpfp.png"
                  }
                };
              }
            } catch (userError) {
              console.error("Error fetching user data for comment:", userError);
            }
            
            return {
              id: commentDoc.id,
              text: commentData.text || '',
              userId: commentData.userId,
              createdAt: commentData.createdAt,
              user: {
                username: "Unknown User",
                profilePicture: "../photos/defaultpfp.png"
              }
            };
          })
        );

        const validComments = commentsWithUserData.filter(Boolean);
        setComments(validComments);
      } catch (error) {
        console.error("Error fetching comments:", error);
        setComments([]);
      }
    }, (error) => {
      console.error("Error in comments listener:", error);
      setComments([]);
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
        const userRef = doc(db, 'users', item.byUser);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUploaderData(userData);
          setUploaderUsername(userData.username || 'Unknown');
        }
      } catch (error) {
        console.error('Error fetching uploader data:', error);
      }
    };

    fetchUploaderData();
  }, [item.byUser]);

  // Fetch video date, caption, and extra text
  useEffect(() => {
    if (!item.id) return;

    const fetchVideoDetails = async () => {
      try {
        const videoRef = doc(db, 'videos', item.id);
        const videoSnap = await getDoc(videoRef);
        if (videoSnap.exists()) {
          const videoData = videoSnap.data();
          setVideoDate(timeAgo(videoData.createdAt.toDate()));
          setCaption(videoData.caption || '');
          setExtraText(videoData.extraText || '');
        }
      } catch (error) {
        console.error('Error fetching video details:', error);
      }
    };

    fetchVideoDetails();
  }, [item.id]);

  // Check if video is bookmarked when component mounts
  useEffect(() => {
    if (!currentUser || !item.id) return;
    
    const checkBookmarkStatus = async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const bookmarksRef = collection(userRef, 'bookmarks');
        const bookmarkQuery = query(bookmarksRef, where('videoId', '==', item.id));
        const bookmarkSnapshot = await getDocs(bookmarkQuery);
        setIsBookmarked(!bookmarkSnapshot.empty);
      } catch (error) {
        console.error("Error checking bookmark status:", error);
      }
    };

    checkBookmarkStatus();
  }, [currentUser, item.id]);

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

  const handleBookmark = async () => {
    if (!currentUser || !item.id) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const bookmarksRef = collection(userRef, 'bookmarks');
      
      if (isBookmarked) {
        const bookmarkQuery = query(bookmarksRef, where('videoId', '==', item.id));
        const bookmarkSnapshot = await getDocs(bookmarkQuery);
        
        if (!bookmarkSnapshot.empty) {
          await deleteDoc(doc(bookmarksRef, bookmarkSnapshot.docs[0].id));
        }
        
        setIsBookmarked(false);
        console.log('Video removed from bookmarks');
      } else {
        await addDoc(bookmarksRef, {
          videoId: item.id,
          createdAt: serverTimestamp()
        });
        
        setIsBookmarked(true);
        console.log('Video added to bookmarks');
      }
    } catch (error) {
      console.error("Error updating bookmark:", error);
    }
  };

  const renderComment = ({ item }: { item: CommentWithUser }) => (
    <View style={styles.commentItem}>
      <Image 
        source={{ uri: item.user.profilePicture }} 
        style={styles.commentUserImage} 
      />
      <View style={styles.commentContent}>
        <Text style={styles.commentUsername}>{item.user.username}</Text>
        <Text style={styles.commentText}>{item.text}</Text>
        {item.createdAt && (
          <Text style={styles.commentTime}>
            {timeAgo(item.createdAt.toDate())}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.videoContainer}>
      <VideoView style={styles.fullscreenVideo} player={player} nativeControls={false} contentFit="contain" />
      <TouchableOpacity style={styles.videoOverlay} onPress={togglePlayPause} activeOpacity={1}>
        {isPaused && (
          <View style={styles.controlsContainer}>
            <Text style={styles.controlButtonText}><PlayIcon width={62} height={62} fill={'white'} opacity={0.35} stroke={'none'}/></Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Social Interaction Buttons */}
      <View style={styles.socialButtons}>
      
        {/* User Profile Button */}
        {item.byUser && (
                <Link href={`/UserProfile?uid=${item.byUser}`} asChild>
                   <TouchableOpacity onPress={handleLike} style={styles.socialButton}>
                    <Image
                      source={{ 
                        uri: uploaderData?.profilePicture || '../photos/defaultpfp.png'
                      }}
                      style={styles.userProfileImage}
                    />
                  </TouchableOpacity>
                </Link>
              )}

        <TouchableOpacity onPress={handleLike} style={styles.socialButton}>
          {isLiked ? <Likes width={32} height={32} fill="#FF4B4B" /> : <Likes width={35} height={35} fill="#FFFFFF" />}
          <Text style={styles.socialButtonText}>{likes.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setCommentModalVisible(true)} style={styles.socialButton}>
          <Comments width={35} height={35} fill="#FFFFFF" />
          <Text style={styles.socialButtonText}>{comments.length}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleBookmark} style={styles.socialButton}> 
        {isBookmarked ? <LocationIcon width={35} height={35} fill="red" /> : <LocationIcon width={35} height={35} fill="#FFF" />}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} style={styles.socialButton}>
          <ShareIcon width={35} height={35} fill='white' stroke="none" strokeWidth="0" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleShare} style={styles.socialButton}>
          <Vinyl width={50} height={40} fill='white' stroke="black" strokeWidth="20" />
        </TouchableOpacity>

      </View>

      {/* Video Details */}
      <View style={styles.videoDetails}>
        <View style={{flexDirection:'row', alignItems:'center' }}><Text style={styles.uploaderUsername}>{uploaderUsername}</Text><Text style={styles.videoDate}>{videoDate}</Text></View>
        <Text style={styles.caption}>{caption}</Text>
        <Text style={styles.extraText}>{extraText}</Text>
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
              renderItem={renderComment}
              style={styles.commentsList}
              ListEmptyComponent={
                <Text style={styles.noCommentsText}>No comments yet</Text>
              }
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
    margin: 0,
    borderRadius: 20,
    padding: 8,
    width: 54,
    height: 54,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  socialButtonText: {
    color: '#FFFFFF',
    marginTop: 1,
    fontSize: 13,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'white'
  },
  bookmarkModalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  bookmarkModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  bookmarkModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bookmarkModalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  bookmarkModalCancelButton: {
    backgroundColor: '#f0f0f0',
  },
  bookmarkModalConfirmButton: {
    backgroundColor: '#007AFF',
  },
  bookmarkModalCancelText: {
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  bookmarkModalConfirmText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  videoDetails: {
    position: 'absolute',
    bottom: 85,
    left: 0,
    right: 70,
    padding: 10,
   
  },
  uploaderUsername: {
    color: 'white',
    fontSize: 19,
    fontWeight: 'bold',
  },
  videoDate: {
    color: 'white',
    fontSize: 12,
    marginTop: 7,
    marginLeft: 3
  },
  caption: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
  },
  extraText: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
  },
});
