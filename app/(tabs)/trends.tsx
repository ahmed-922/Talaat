import { useEffect, useState, useRef, useCallback } from 'react';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View, Button, FlatList, Dimensions, ScrollView, TouchableOpacity, Text } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { ViewToken } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import PlayIcon from '../../components/svgs/playIcon'


const { height, width } = Dimensions.get("window");

const VideoItem = ({ item, isVisible, playerRef }: { item: any, isVisible: boolean, playerRef: any }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [lastToggleTime, setLastToggleTime] = useState(0);
  const player = useVideoPlayer(item.mediaUrl, async player => {
    player.loop = true;
    player.controls = false; // Disable default controls
    player.nativeControls = false; // Ensure native controls are disabled
    await player.enterFullscreen(); // Enter fullscreen mode
    if (isVisible) {
      player.play();
    } else {
      setTimeout(() => {
        player.pause();
      }, 500); // Add a delay of 500ms before pausing
    }
  });

  useEffect(() => {
    playerRef.current[item.id] = player;
    return () => {
      playerRef.current[item.id].pause();
      delete playerRef.current[item.id];
    };
  }, [player, playerRef, item.id]);

  useEffect(() => {
    if (isVisible) {
      player.play();
    } else {
      setTimeout(() => {
        player.pause();
      }, 10); // Add a delay of 500ms before pausing
    }
  }, [isVisible]);

  const togglePlayPause = () => {
    const now = Date.now();
    if (now - lastToggleTime < 500) return; // Prevent toggling if less than 500ms since last toggle

    if (player.playing) {
      player.pause();
      setIsPaused(true);
    } else {
      player.play();
      setIsPaused(false);
    }
    setLastToggleTime(now);
  };

  return (
    <View style={styles.videoContainer}>
      <VideoView style={styles.fullscreenVideo} player={player} nativeControls={false} contentFit="contain" />
      <TouchableOpacity style={styles.videoOverlay} onPress={togglePlayPause}>
        {isPaused && (
          <View style={styles.controlsContainer}>
            <Text style={styles.controlButtonText}><PlayIcon width={65} height={65} fill={'white'} opacity={1}/></Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default function VideoScreen() {
  const [videos, setVideos] = useState<any[]>([]);
  const [visibleItem, setVisibleItem] = useState<string | null>(null);
  const playerRef = useRef<{ [key: string]: any }>({});
  const flatListRef = useRef<FlatList>(null);
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setVisibleItem(viewableItems[0].item.id);
    }
  }).current;

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'videos'));
        const videoData = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(doc => doc.mediaUrl);
        setVideos(videoData);
      } catch (error) {
        console.error('Error fetching videos:', error);
      }
    };
    fetchVideos();
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        Object.values(playerRef.current).forEach(player => {
          setTimeout(() => {
            player.pause();
          }, 100); // Add a delay of 500ms before pausing
        });
      };
    }, [])
  );

  if (videos.length === 0) {
    return (
      <View style={styles.noVideosContainer}>
        <Text style={styles.noVideosText}>No videos available</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black", height: height, width: width }}>
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={({ item }) => (
          <View style={styles.videoWrapper}>
            <VideoItem item={item} isVisible={item.id === visibleItem} playerRef={playerRef} />
            
          </View>
        )}
        keyExtractor={item => item.id}
        pagingEnabled
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
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
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoWrapper: {
   maxHeight: '70%',
   maxWidth: '100%',
  
  },
  videoContainer: {
    height: height,
    width: width,
    marginTop: -40
  },
  fullscreenVideo: {
    height: "100%",
    width: "100%",
  },
  controlsContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 10,
    borderRadius: 5,
    
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
  },
  endOfListText: {
    color: 'white',
    fontSize: 16,
  },
});

