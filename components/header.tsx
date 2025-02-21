import React from 'react';
import {Link } from 'expo-router'
import { View, Text, StyleSheet, Button, Pressable } from 'react-native';
import Tags from './tags';
import DM from './svgs/dm';

export default function Header() {
  return (
    <View style={{justifyContent:'center'}}>
        <View style={{height: 60}}></View>
    <View style={styles.header}>
      <Text style={styles.title}>TALAAT</Text>
      <Tags/>
   <Link href="../(pages)/messages" >
            <DM/>
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
    padding: 10
    // If you want it absolutely pinned, you could add:
    // position: 'absolute',
    // top: 0,
    // left: 0,
    // right: 0,
    // zIndex: 999,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
