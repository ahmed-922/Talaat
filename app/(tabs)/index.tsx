// index.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged } from '@firebase/auth';
import Header from '../../components/header';
import Media from '../../components/media';

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
    <View style={styles.splashContainer}>
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
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Fixed Header at the Top */}
      <Header />

      {/* Main Content Below the Header */}
      <View style={{ flex: 1 }}>
        <Media />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    paddingTop: 50,
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
