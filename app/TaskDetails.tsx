import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function TaskDetails() {
  const { task } = useLocalSearchParams();
  const [taskDetails, setTaskDetails] = useState({});
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (task) {
      setTaskDetails(JSON.parse(task));
    }
  }, [task]);

  const themeTextStyle = colorScheme === 'light' ? styles.lightThemeText : styles.darkThemeText;
  const themeContainerStyle = colorScheme === 'light' ? styles.lightContainer : styles.darkContainer;

  return (
    <View style={[styles.container, themeContainerStyle]}>
      <Text style={[styles.header, themeTextStyle]}>Task Details</Text>
      <Text style={[styles.price, themeTextStyle]}>Price: {taskDetails.price}</Text>

      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, themeTextStyle]}>Description</Text>
        <Text style={themeTextStyle}>{taskDetails.description}</Text>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, themeTextStyle]}>Skills</Text>
        <View style={styles.skillsContainer}>
          {taskDetails.skills && typeof taskDetails.skills === 'string' ? (
            taskDetails.skills.split(',').map((skill, index) => (
              <View key={index} style={styles.skillBubble}>
                <Text style={styles.skillBubbleText}>{skill}</Text>
              </View>
            ))
          ) : null}
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, themeTextStyle]}>About Client</Text>
        <Text style={themeTextStyle}>Name: {taskDetails.clientName}</Text>
        <Text style={themeTextStyle}>Location: {taskDetails.clientLocation}</Text>
        <Text style={themeTextStyle}>Nationality: {taskDetails.clientNationality}</Text>
        <Text style={themeTextStyle}>Account Created: {taskDetails.clientAccountCreation}</Text>
        <Text style={themeTextStyle}>Phone Number: {taskDetails.clientPhoneNumber}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    marginBottom: 16,
  },
  sectionContainer: {
    borderWidth: 1,
    borderColor: 'red',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  skillBubble: {
    backgroundColor: 'lightgray',
    borderRadius: 20,
    padding: 8,
    margin: 4,
  },
  skillBubbleText: {
    color: 'black', // Set text color to black directly
  },
  lightThemeText: {
    color: 'black',
  },
  darkThemeText: {
    color: 'white',
  },
  lightContainer: {
    backgroundColor: 'white',
  },
  darkContainer: {
    backgroundColor: 'black',
  },
  link: {
    textDecorationLine: 'none',
  },
});