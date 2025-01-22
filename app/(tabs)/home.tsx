import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, useColorScheme, StyleSheet } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Link } from 'expo-router';

export const HEADER_HEIGHT = 100;

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const colorScheme = useColorScheme();

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
      <View style={[styles.taskItem, themeContainerStyle] }>
        <Text style={[styles.title, themeTextStyle]}>{item.title}</Text>
        <Text  style={[themeTextStyle]}>{item.description}</Text>
        <Text  style={[themeTextStyle]}>Price: {item.price}</Text>
        <Text  style={[themeTextStyle]}>Duration: {item.duration}</Text>
      </View>
    </Link>
  );

  const themeTextStyle = colorScheme === 'light' ? styles.lightThemeText : styles.darkThemeText;
  const themeContainerStyle = colorScheme === 'light' ? styles.lightContainer : styles.darkContainer;

  return (
    <View style={[styles.container, themeContainerStyle]}>
       <View style={styles.header} />
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
  },
  header: { 
    height: HEADER_HEIGHT,
  },
  taskItem: {
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    textDecorationLine: 'none',
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
