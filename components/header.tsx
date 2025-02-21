import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import Tags from './tags';
import DM from './svgs/dm';

export default function Header() {
  return (
    <View style={{ justifyContent: 'center' }}>
      <View style={{ height: 60 }} />
      {/* Use Link to navigate to the Chats page */}
      <View style={styles.header}>
        <Text style={styles.title}>TALAAT</Text>
        <Tags />
        <Link href="/chats">
        <DM />
      </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 70,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
