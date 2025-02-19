import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged } from '@firebase/auth';
import Media from '../../components/media';

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

  if (loading) {
    return <SplashScreen onAuthCheckComplete={() => setLoading(false)} />;
  }
  return (
    // Make sure the outer container fills the screen using flex: 1
    <View style={{ flex: 1 }}>
      <View style={[styles.header, styles.lightHeader]} />
      <View style={{ flex: 1 }}>
        <Media />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    alignItems: 'center',
    justifyContent: 'center'
  },
  header: {
    height: HEADER_HEIGHT,
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8
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
  text: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold'
  }
});
