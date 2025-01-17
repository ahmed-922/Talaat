import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TextInput, Button, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router'; // Import useRouter for navigation
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Adjust the path as necessary
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter(); // Use router for navigation

  useEffect(() => {
    const checkUser = async () => {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        router.push('/home');
      }
    };
    checkUser();
  }, []);

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        await AsyncStorage.setItem('user', JSON.stringify(userCredential.user));
        Alert.alert('Login successful!', 'Redirecting to home page...');
        router.push('/home'); // Navigate to the Home screen
      })
      .catch((error) => {
        Alert.alert('Error', error.message);
      });
  };

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
  },
  signupContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  signupLabel: {
    fontSize: 14,
  },
  button: {
    backgroundColor: 'blue',
    color: 'white',
    padding: 10,
    textAlign: 'center',
    marginTop: 10,
  },
});
