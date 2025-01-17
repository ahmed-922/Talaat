import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { HEADER_HEIGHT } from './home';

export default function NewTask() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');

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

  return (
    <View style={styles.container}>
    <View style={styles.header} />
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter task title"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter task description"
      />

      <Text style={styles.label}>Price Tag</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        placeholder="Enter price tag"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Task Duration</Text>
      <TextInput
        style={styles.input}
        value={duration}
        onChangeText={setDuration}
        placeholder="Enter task duration"
      />

      <Button title="Create Task" onPress={handleSubmit} />
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