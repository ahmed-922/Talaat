import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AboutScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>About This App</Text>
      <Text style={styles.description}>
        This app is designed to help you manage your tasks and settings efficiently. 
        Developed with React Native, it provides a seamless user experience across devices.
      </Text>
      <Text style={styles.developer}>
        Developed by [Your Name]
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  developer: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default AboutScreen;