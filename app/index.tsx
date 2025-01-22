import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TextInput, Button, Alert, Animated, ImageBackground, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SplashScreen = ({ onAuthCheckComplete }: { onAuthCheckComplete: () => void }) => {
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const checkAuthentication = async () => {
      const user = auth.currentUser;
      if (user) {
        router.push('/home');
      } else {
        onAuthCheckComplete();
      }
    };
    checkAuthentication();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth();
  const [emailLabelAnim] = useState(new Animated.Value(0));
  const [passwordLabelAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const listener = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/home');
      } else {
        setLoading(false);
      }
    });

    return () => {
      listener();
    };
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/home');
    } catch (error: any) {
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

  if (loading) {
    return <SplashScreen onAuthCheckComplete={() => setLoading(false)} />;
  }

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

        <Button title="Login" onPress={handleLogin} />

        
      </View>
      <View style={styles.signupContainer}>
          <Text style={styles.signupLabel}>You don't have an account?</Text>
          <Link href="/signup" style={styles.button}>
            Signup
          </Link>
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Semi-transparent white background
    borderWidth: 1,
    backdropFilter: 'blur(10px)', // Blur effect
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
    paddingHorizontal: 5,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderBottomWidth: 1,
    borderRadius: 20, // More rounded corners
    paddingHorizontal: 8,
    width: '100%',
  },
  signupContainer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  signupLabel: {
    fontSize: 14,
  },
  button: {
    color: 'blue',
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
