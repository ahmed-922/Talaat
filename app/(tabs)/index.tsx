import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  ActivityIndicator
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons'; // Import MaterialIcons for bookmark icon
import { getAuth, onAuthStateChanged } from '@firebase/auth';

export const HEADER_HEIGHT = 100;

const SplashScreen = ({ onAuthCheckComplete }: { onAuthCheckComplete: () => void }) => {
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const checkAuthentication = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
      } else {
        onAuthCheckComplete();
      }
    };
    checkAuthentication();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
};

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [showFullDescriptions, setShowFullDescriptions] = useState({});
  const [bookmarkedTasks, setBookmarkedTasks] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const colorScheme = useColorScheme();
  const router = useRouter();
  const auth = getAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const listener = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
      } else {
        setLoading(false);
      }
    });

    return () => {
      listener();
    };
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'tasks'));
        const tasksList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setTasks(tasksList);
        setFilteredTasks(tasksList);
      } catch (e) {
        console.error('Error fetching tasks: ', e);
      }
    };

    fetchTasks();
  }, []);


  if (loading) {
    return <SplashScreen onAuthCheckComplete={() => setLoading(false)} />;
  }

  const handleToggleDescription = (id) => {
    setShowFullDescriptions((prevState) => ({
      ...prevState,
      [id]: !prevState[id]
    }));
  };

  const handleToggleBookmark = (id) => {
    setBookmarkedTasks((prevState) => ({
      ...prevState,
      [id]: !prevState[id]
    }));
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const trimmedQuery = query.replace(/\s+/g, ''); // Remove spaces from the query
    if (trimmedQuery) {
      const filtered = tasks.filter((task) =>
        task.title.replace(/\s+/g, '').toLowerCase().includes(trimmedQuery.toLowerCase())
      );
      setFilteredTasks(filtered);
    } else {
      setFilteredTasks(tasks);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredTasks(tasks);
  };

  const renderItem = ({ item }) => {
    const descriptionLimit = 100; // Set the character limit for the description
    const showFullDescription = showFullDescriptions[item.id];
    const isBookmarked = bookmarkedTasks[item.id];

    const themeTextStyle = colorScheme === 'light' ? styles.lightThemeText : styles.darkThemeText;
    const themeContainerStyle = colorScheme === 'light' ? styles.lightContainer : styles.darkContainer;

    return (
      <Link href={{ pathname: 'TaskDetails', params: { task: JSON.stringify(item) } }} style={styles.link}>
        <View style={[styles.taskItem, themeContainerStyle]}>
          <Text style={[styles.title, themeTextStyle]}>{item.title}</Text>
          <TouchableOpacity style={styles.bookmarkButton} onPress={() => handleToggleBookmark(item.id)}>
            <MaterialIcons name={isBookmarked ? 'bookmark' : 'bookmark-border'} size={24} color="black" />
          </TouchableOpacity>
          <Text style={themeTextStyle}>Price: {item.price} BD</Text>
          <Text style={themeTextStyle}>
            {showFullDescription || item.description.length <= descriptionLimit
              ? item.description
              : `${item.description.substring(0, descriptionLimit)}... `}
            {item.description.length > descriptionLimit && (
              <TouchableOpacity onPress={() => handleToggleDescription(item.id)}>
                <Text style={styles.moreText}>{showFullDescription ? 'less' : 'more'}</Text>
              </TouchableOpacity>
            )}
          </Text>
          <View style={styles.skillsContainer}>
            {item.skills && typeof item.skills === 'string' ? (
              item.skills.split(',').map((skill, index) => (
                <View key={index} style={styles.skillBubble}>
                  <Text style={styles.skillBubbleText}>{skill.trim()}</Text>
                </View>
              ))
            ) : (
              <Text style={themeTextStyle}>No skills listed</Text>
            )}
          </View>
        </View>
      </Link>
    );
  };

  const themeHeaderStyle = colorScheme === 'light' ? styles.lightHeader : styles.darkHeader;
  const themeHeaderTextStyle = colorScheme === 'light' ? styles.lightHeaderText : styles.darkHeaderText;

  return (
    <View style={styles.container}>
      <View style={[styles.header, themeHeaderStyle]}>
        <Text style={[styles.headerText, themeHeaderTextStyle]}>Taskat</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchBar}
            placeholder="Search tasks..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={colorScheme === 'light' ? '#242c40' : '#d0d0c0'}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <MaterialIcons name="clear" size={24} color="black" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <FlatList data={filteredTasks} renderItem={renderItem} keyExtractor={(item) => item.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    paddingHorizontal: 16
  },
  lightHeader: {
    backgroundColor: '#f8f8f8'
  },
  darkHeader: {
    backgroundColor: 'rgb(10, 10, 10)'
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1
  },
  lightHeaderText: {
    color: '#000'
  },
  darkHeaderText: {
    color: '#fff'
  },
  searchContainer: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative'
  },
  searchBar: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingRight: 40 // Add padding to make space for the clear button
  },
  clearButton: {
    position: 'absolute',
    right: 10
  },
  taskItem: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 8,
    width: '100%',
    position: 'relative'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8
  },
  moreText: {
    color: 'blue',
    marginLeft: 15
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8
  },
  skillBubble: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    margin: 4
  },
  skillBubbleText: {
    color: 'black'
  },
  lightThemeText: {
    color: 'black'
  },
  darkThemeText: {
    color: 'white'
  },
  lightContainer: {
    backgroundColor: 'rgba(213, 213, 213, 0.56)',
    borderColor: 'rgba(39, 37, 37, 0.27)'
  },
  darkContainer: {
    backgroundColor: '#181818'
  },
  link: {
    textDecorationLine: 'none'
  },
  bookmarkButton: {
    position: 'absolute',
    top: 16,
    right: 16
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold'
  }
});
