import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
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

  if (loading) {
    return <SplashScreen onAuthCheckComplete={() => setLoading(false)} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button title="Login" onPress={handleLogin} />

      <View style={styles.signupContainer}>
        <Text style={styles.signupLabel}>You don't have an account?</Text>
        <Link href="/signup" style={styles.button}>
          Signup
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    width: '100%',
  },
  signupContainer: {
    position: 'absolute',
    bottom: 16,
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
