import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, KeyboardAvoidingView, ImageBackground, useColorScheme } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export const HEADER_HEIGHT = 100;

export default function NewTask() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [skills, setSkills] = useState('');
  const colorScheme = useColorScheme();

  const handleSubmit = async () => {
    try {
      await addDoc(collection(db, 'tasks'), {
        title,
        description,
        price,
        duration,
        skills,
      });
      console.log('Task added successfully');
    } catch (e) {
      console.error('Error adding task: ', e);
    }
  };

  const themeCardStyle =
    colorScheme === 'light'
      ? styles.lightCard
      : styles.darkCard;

  const themeTextStyle =
    colorScheme === 'light'
      ? styles.lightThemeText
      : styles.darkThemeText;

  return (
    <ImageBackground
      source={{
        uri: 'https://letsenhance.io/static/8f5e523ee6b2479e26ecc91b9c25261e/1015f/MainAfter.jpg',
      }}
      style={styles.background}
    >
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={[styles.card, themeCardStyle]}>
            <Text style={[styles.header, themeTextStyle]}>
              Post your task
            </Text>
            <Text style={[styles.label, themeTextStyle]}>
              What will your task be?
            </Text>
            <TextInput
              style={[styles.input, themeTextStyle]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter task title"
              placeholderTextColor={
                colorScheme === 'light' ? '#242c40' : '#d0d0c0'
              }
            />
            <Text style={[styles.label, themeTextStyle]}>
              Give a brief description about your task
            </Text>
            <TextInput
              style={[styles.input, themeTextStyle]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter task description"
              placeholderTextColor={
                colorScheme === 'light' ? '#242c40' : '#d0d0c0'
              }
            />
            <Text style={[styles.label, themeTextStyle]}>
              Enter your price (BD will be added automatically)
            </Text>
            <TextInput
              style={[styles.input, themeTextStyle]}
              value={price}
              onChangeText={setPrice}
              placeholder="Enter task price"
              placeholderTextColor={
                colorScheme === 'light' ? '#242c40' : '#d0d0c0'
              }
              keyboardType="numeric"
            />
            <Text style={[styles.label, themeTextStyle]}>
              How long will your task take?
            </Text>
            <TextInput
              style={[styles.input, themeTextStyle]}
              value={duration}
              onChangeText={setDuration}
              placeholder="Enter task duration"
              placeholderTextColor={
                colorScheme === 'light' ? '#242c40' : '#d0d0c0'
              }
            />
            <Text style={[styles.label, themeTextStyle]}>
              Enter required skills needed for this task
            </Text>
            <TextInput
              style={[styles.input, themeTextStyle]}
              value={skills}
              onChangeText={setSkills}
              placeholder="Enter task skills"
              placeholderTextColor={
                colorScheme === 'light' ? '#242c40' : '#d0d0c0'
              }
            />
            <Button title="Submit" onPress={handleSubmit} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 10,
    padding: 20,
    width: '100%',
    height: '90%',
    marginTop: 350,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    bottom: 0,
  },
  lightCard: {
    backgroundColor: '#fff',
    shadowColor: '#aaa',
  },
  darkCard: {
    backgroundColor: '#181818',
    shadowColor: '#000',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    marginVertical: 10,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    width: '100%',
    borderColor: '#ccc',
  },
  lightThemeText: {
    color: '#000',
  },
  darkThemeText: {
    color: '#fff',
  },
});
