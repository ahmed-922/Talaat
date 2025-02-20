import React, { useState } from 'react';
import { Text, View, StyleSheet, TextInput, Button, Alert, Animated } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig'; // Adjust the path as necessary
import { ImageBackground } from 'react-native';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [usernameLabelAnim] = useState(new Animated.Value(0));
  const [emailLabelAnim] = useState(new Animated.Value(0));
  const [passwordLabelAnim] = useState(new Animated.Value(0));

  const handleSignup = async () => {
    try {
      // Check if the username is unique
      const usernameQuery = query(collection(db, 'users'), where('username', '==', username));
      const usernameSnapshot = await getDocs(usernameQuery);

      if (!usernameSnapshot.empty) {
        Alert.alert('Username already taken. Please choose another one.');
        return;
      }

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Retrieve the default profile picture URL from Firebase Storage
      const storage = getStorage();
      const defaultImageRef = ref(storage, 'gs://talaat-c40db.firebasestorage.app/profilePictures/Default/defaultpfp.png');
      const defaultProfilePictureUrl = await getDownloadURL(defaultImageRef);

      // Add user to Firestore with the default profile picture
      await addDoc(collection(db, 'users'), {
        uid: user.uid,
        email: user.email,
        username: username,
        profilePicture: defaultProfilePictureUrl,
      });

      Alert.alert('User registered successfully!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const animateLabel = (animValue, toValue) => {
    Animated.timing(animValue, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  return (
    <ImageBackground
      source={{ uri: 'https://letsenhance.io/static/8f5e523ee6b2479e26ecc91b9c25261e/1015f/MainAfter.jpg' }}
      style={styles.background}
    >
      <View style={styles.box}>
        <View style={styles.inputContainer}>
          <Animated.Text
            style={[
              styles.label,
              {
                top: usernameLabelAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [11, -10],
                }),
                opacity: usernameLabelAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ]}
          >
            Username
          </Animated.Text>
          <TextInput
            style={styles.input}
            placeholder=""
            value={username}
            onChangeText={setUsername}
            onFocus={() => animateLabel(usernameLabelAnim, 1)}
            onBlur={() => {
              if (!username) animateLabel(usernameLabelAnim, 0);
            }}
          />
        </View>

        <View style={styles.inputContainer}>
          <Animated.Text
            style={[
              styles.label,
              {
                top: emailLabelAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [11, -10],
                }),
                opacity: emailLabelAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ]}
          >
            Email
          </Animated.Text>
          <TextInput
            style={styles.input}
            placeholder=""
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            onFocus={() => animateLabel(emailLabelAnim, 1)}
            onBlur={() => {
              if (!email) animateLabel(emailLabelAnim, 0);
            }}
          />
        </View>

        <View style={styles.inputContainer}>
          <Animated.Text
            style={[
              styles.label,
              {
                top: passwordLabelAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [11, -10],
                }),
                opacity: passwordLabelAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ]}
          >
            Password
          </Animated.Text>
          <TextInput
            style={styles.input}
            placeholder=""
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onFocus={() => animateLabel(passwordLabelAnim, 1)}
            onBlur={() => {
              if (!password) animateLabel(passwordLabelAnim, 0);
            }}
          />
        </View>

        <Button title="register" onPress={handleSignup} />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    backdropFilter: 'blur(10px)',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  label: {
    position: 'absolute',
    left: 10,
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0)',
    paddingHorizontal: 5,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderBottomWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    width: '100%',
  },
});
