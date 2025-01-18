import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function TaskDetails() {
  const { task } = useLocalSearchParams();
  const taskDetails = JSON.parse(task);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{taskDetails.title}</Text>
      <Text>{taskDetails.description}</Text>
      <Text>Price: {taskDetails.price}</Text>
      <Text>Duration: {taskDetails.duration}</Text>
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
});