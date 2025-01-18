import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Link } from 'expo-router';

export const HEADER_HEIGHT = 100;

export default function TaskList() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'tasks'));
        const tasksList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTasks(tasksList);
      } catch (e) {
        console.error('Error fetching tasks: ', e);
      }
    };

    fetchTasks();
  }, []);

  const renderItem = ({ item }) => (
    <Link href={{ pathname: 'TaskDetails', params: { task: JSON.stringify(item) } }} style={styles.link}>
      <View style={styles.taskItem}>
        <Text style={styles.title}>{item.title}</Text>
        <Text>{item.description}</Text>
        <Text>Price: {item.price}</Text>
        <Text>Duration: {item.duration}</Text>
      </View>
    </Link>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  taskItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    textDecorationLine: 'none',
  },
});