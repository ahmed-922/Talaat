import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native"; // ✅ Added for page focus tracking
import CameraIcon from '../../components/svgs/camera';
import FlipcameraIcon from '../../components/svgs/flipCamera';
import GallaryIcon from '../../components/svgs/gallary';

export default function NewPost() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [media, setMedia] = useState<string | null>(null);
  const router = useRouter();
  const isFocused = useIsFocused();

  const takePicture = async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync();
      setMedia(photo.uri);
      router.push({
        pathname: "/upload",
        params: { uri: photo.uri, type: "image" },
      });
      setMedia(null);
    }
  };

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const selectedMedia = result.assets[0];
      setMedia(selectedMedia.uri);

      router.push({
        pathname: "/upload",
        params: { uri: selectedMedia.uri, type: selectedMedia.type },
      });
      setMedia(null);
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View style={styles.container}>
      {media ? (
        <Image source={{ uri: media }} style={styles.preview} />
      ) : (
        isFocused && ( 
          <CameraView
            style={styles.camera}
            type={facing}
            ref={(ref) => setCameraRef(ref)}
          />
        )
      )}

      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleCameraFacing}>
          <FlipcameraIcon fill='white' width={32} height={32}  />
        </TouchableOpacity>

        <TouchableOpacity onPress={takePicture}>
          <CameraIcon fill='white' width={32} height={32} />
        </TouchableOpacity>

        <TouchableOpacity onPress={pickMedia}>
          <GallaryIcon fill='white' width={32} height={32} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  preview: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    backgroundColor: 'blue',
    height: 50,
    alignContent: 'center',
    alignItems: 'center',
  },
  message: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
});
