import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function TaskDetails() {
  const { task } = useLocalSearchParams();
  const taskDetails = JSON.parse(task);
  const colorScheme = useColorScheme();

  const themeTextStyle = colorScheme === 'light' ? styles.lightThemeText : styles.darkThemeText;
  const themeContainerStyle = colorScheme === 'light' ? styles.lightContainer : styles.darkContainer;

  return (
    <View style={[styles.container, themeContainerStyle]}>
      <Text style={[styles.title, themeTextStyle]}>{taskDetails.title}</Text>
      <Text style={themeTextStyle}>{taskDetails.description}</Text>
      <Text style={themeTextStyle}>Price: {taskDetails.price}</Text>
      <Text style={themeTextStyle}>Duration: {taskDetails.duration}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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