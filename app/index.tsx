import React, { useState } from 'react';
import { Text, View, StyleSheet, TextInput, Button, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router'; // Import useRouter for navigation

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter(); // Use router for navigation

  const handleLogin = () => {
    if (username === 'admin' && password === '123') {
      Alert.alert('Login successful!', 'Redirecting to home page...');
      router.push('/home'); // Navigate to the Home screen
    } else {
      Alert.alert('Error', 'Invalid username or password');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your username"
        value={username}
        onChangeText={setUsername}
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
