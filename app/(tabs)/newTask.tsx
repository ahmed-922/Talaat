import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, useColorScheme } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { HEADER_HEIGHT } from './home';

export default function NewTask() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const colorScheme = useColorScheme();

  const handleSubmit = async () => {
    try {
      await addDoc(collection(db, 'tasks'), {
        title,
        description,
        price,
        duration,
      });
      console.log('Task added successfully');
    } catch (e) {
      console.error('Error adding task: ', e);
    }
  };

  const themeTextStyle = colorScheme === 'light' ? styles.lightThemeText : styles.darkThemeText;
  const themeContainerStyle = colorScheme === 'light' ? styles.lightContainer : styles.darkContainer;

  return (
    <View style={[styles.container, themeContainerStyle]}>
      <View style={styles.header} />
      <Text style={[styles.label, themeTextStyle]}>Title</Text>
      <TextInput
        style={[styles.input, themeTextStyle]}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter task title"
        placeholderTextColor={colorScheme === 'light' ? '#242c40' : '#d0d0c0'}
      />
      <Text style={[styles.label, themeTextStyle]}>Description</Text>
      <TextInput
        style={[styles.input, themeTextStyle]}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter task description"
        placeholderTextColor={colorScheme === 'light' ? '#242c40' : '#d0d0c0'}
      />
      <Text style={[styles.label, themeTextStyle]}>Price</Text>
      <TextInput
        style={[styles.input, themeTextStyle]}
        value={price}
        onChangeText={setPrice}
        placeholder="Enter task price"
        placeholderTextColor={colorScheme === 'light' ? '#242c40' : '#d0d0c0'}
      />
      <Text style={[styles.label, themeTextStyle]}>Duration</Text>
      <TextInput
        style={[styles.input, themeTextStyle]}
        value={duration}
        onChangeText={setDuration}
        placeholder="Enter task duration"
        placeholderTextColor={colorScheme === 'light' ? '#242c40' : '#d0d0c0'}
      />
      <Button title="Add Task" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    height: HEADER_HEIGHT,
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
    backgroundColor: '#0A0A0A',
  },
  lightThemeText: {
    color: '#242c40',
  },
  darkThemeText: {
    color: '#E6E8E9',
  },
});