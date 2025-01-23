import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function Help() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Help & Support</Text>
      <Text style={styles.sectionTitle}>Getting Started</Text>
      <Text style={styles.text}>
        Welcome to our app! To get started, simply create an account and log in. You can then browse tasks, bookmark your favorites, and view task details.
      </Text>
      <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
      <Text style={styles.question}>How do I create an account?</Text>
      <Text style={styles.answer}>
        To create an account, click on the "Sign Up" button on the login screen and fill in your details.
      </Text>
      <Text style={styles.question}>How do I bookmark a task?</Text>
      <Text style={styles.answer}>
        To bookmark a task, click on the bookmark icon next to the task title. You can view your bookmarked tasks in the "Bookmarks" section.
      </Text>
      <Text style={styles.sectionTitle}>Contact Us</Text>
      <Text style={styles.text}>
        If you have any questions or need further assistance, please contact our support team at support@example.com.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
  },
  question: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  answer: {
    fontSize: 16,
    marginBottom: 8,
  },
});