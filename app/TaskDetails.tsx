import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, Button, TextInput, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { addDoc, collection, getDoc, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';

export default function TaskDetails() {
  const { task } = useLocalSearchParams();
  const [taskDetails, setTaskDetails] = useState({id: '', price: '', description: '', skills: ''});
  const [application, setApplication] = useState({taskId: '', reason: '', askingPrice: '', timeNeeded: '', userId: ''});
  const colorScheme = useColorScheme();

  const [reason, setReason] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [timeNeeded, setTimeNeeded] = useState('');

  const fetchApplication = async () => {
    if (taskDetails.id && auth.currentUser) {
      const applicationQuery = query(
        collection(db, 'applications'),
        where('taskId', '==', taskDetails.id),
        where('userId', '==', auth.currentUser.uid)
      );
      const applicationSnapshot = await getDocs(applicationQuery);
      if (!applicationSnapshot.empty) {
        setApplication(applicationSnapshot.docs[0].data());
      }
    }
  };


  useEffect(() => {
    if (task) {
      setTaskDetails(JSON.parse(task));
    }
  }, [task]);

  useEffect(() => {
    fetchApplication();
  }, [taskDetails.id]);

  const handleSubmit = async () => {
    try {
      await addDoc(collection(db, 'applications'), {
        taskId: taskDetails.id,
        reason,
        askingPrice,
        timeNeeded,
        userId: auth.currentUser?.uid
      });
      Alert.alert('Application submitted successfully');
      await fetchApplication();
    } catch (e) {
      console.error('Error submitting application: ', e);
      Alert.alert('Error submitting application');
    } 
  };

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

      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Apply for this Job</Text>
        <Text style={styles.label}>Why do you think you can get this job done?</Text>
        <TextInput
          style={styles.input}
          placeholder="Why do you think you can get this job done?"
          value={reason}
          onChangeText={setReason}
        />
        <Text style={styles.label}>Your asking price (BHD/hour)</Text>
        <TextInput
          style={styles.input}
          placeholder="Your asking price (BHD/hour)"
          value={askingPrice}
          onChangeText={setAskingPrice}
          keyboardType="numeric"
        />
         <Text style={styles.label}>Time needed (in hours)</Text>
        <TextInput
          style={styles.input}
          placeholder="Time needed (in hours)"
          value={timeNeeded}
          onChangeText={setTimeNeeded}
        />
        <Button title="Submit" onPress={handleSubmit} disabled={!!application.taskId}/>
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
  formContainer: {
    marginTop: 32,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
});