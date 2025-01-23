import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';

const SettingsScreen = () => {
  const router = useRouter();
  const auth = getAuth();

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        // Sign-out successful.
        router.push('./'); // Redirect to login screen after sign-out
      })
      .catch((error) => {
        // An error happened.
        console.error('Error signing out: ', error);
      });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.item} onPress={() => router.push('/UserTasks')}>
        <Text style={styles.itemText}>Your Tasks</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => router.push('/AccountScreen')}>
        <Text style={styles.itemText}>Accounts</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => router.push('/help')}>
        <Text style={styles.itemText}>Help</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => router.push('/AboutScreen')}>
        <Text style={styles.itemText}>About</Text>
      </TouchableOpacity>
      <View style={{ marginTop: 20 }}>
      <Text style={{ fontSize: 18, color: 'blue', padding: 5 }}  >Switch profile</Text>
        <Text style={{ fontSize: 18, color: 'red', padding: 5  }}  onPress={handleSignOut} >Log out</Text>
        </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemText: {
    fontSize: 18,
  },
});

export default SettingsScreen;