import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, useColorScheme } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function Settings() {
  const { user } = useLocalSearchParams();
  const userDetails = JSON.parse(user);
  const [username, setUsername] = useState(userDetails.username);
  const [profilePicture, setProfilePicture] = useState(userDetails.profilePicture);
  const colorScheme = useColorScheme();

  const handleSave = async () => {
    try {
      const userDoc = doc(db, 'users', userDetails.uid);
      await updateDoc(userDoc, {
        username,
        profilePicture,
      });
      console.log('Profile updated successfully');
    } catch (e) {
      console.error('Error updating profile: ', e);
    }
  };

  const themeTextStyle = colorScheme === 'light' ? styles.lightThemeText : styles.darkThemeText;
  const themeContainerStyle = colorScheme === 'light' ? styles.lightContainer : styles.darkContainer;

  return (
    <View style={[styles.container, themeContainerStyle]}>
      <Text style={[styles.label, themeTextStyle]}>Username</Text>
      <TextInput
        style={[styles.input, themeTextStyle]}
        value={username}
        onChangeText={setUsername}
        placeholder="Enter your username"
        placeholderTextColor={colorScheme === 'light' ? '#242c40' : '#d0d0c0'}
      />
      <Text style={[styles.label, themeTextStyle]}>Profile Picture URL</Text>
      <TextInput
        style={[styles.input, themeTextStyle]}
        value={profilePicture}
        onChangeText={setProfilePicture}
        placeholder="Enter profile picture URL"
        placeholderTextColor={colorScheme === 'light' ? '#242c40' : '#d0d0c0'}
      />
      <Button title="Save" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  lightContainer: {
    backgroundColor: '#d0d0c0',
  },
  darkContainer: {
    backgroundColor: '#242c40',
  },
  lightThemeText: {
    color: '#242c40',
  },
  darkThemeText: {
    color: '#d0d0c0',
  },
});