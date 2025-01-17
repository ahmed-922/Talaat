import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { HEADER_HEIGHT } from './home';

export default function UserProfile() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');

  const handleSubmit = async () => {
    try {
      await addDoc(collection(db, 'users'), {
        name,
        email,
        bio,
      });
      console.log('User profile added successfully');
    } catch (e) {
      console.error('Error adding user profile: ', e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header} />
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={styles.input}
        value={bio}
        onChangeText={setBio}
        placeholder="Enter your bio"
      />

      <Button title="Save Profile" onPress={handleSubmit} />
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
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
});