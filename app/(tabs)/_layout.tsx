import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import TrendsIcon from '@/components/svgs/trends';
import SearchIcon from '@/components/svgs/searchIcon'; 
import HomeIcon from '@/components/svgs/homeIcon';
import CreateIcon from '@/components/svgs/createIcon';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
           
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarIcon: ({ color }) => <HomeIcon width={24} height={24} fill={color} />,
        }}
      />
       <Tabs.Screen
        name="search"
        options={{
          title: '',
          headerShown: false,
          tabBarIcon: ({ color }) => 
          <SearchIcon width={24} height={24} fill={color} />,
        }}
      />
      <Tabs.Screen
        name="newPost"
        options={{
          title: '',
          headerShown: false,
          tabBarIcon: ({ color }) => 
            <CreateIcon width={24} height={24} fill={color} />
        }}
      />
     <Tabs.Screen
  name="trends"
  options={{
    title: 'trends',
    headerShown: false,
    tabBarIcon: ({ color }) => (
      <TrendsIcon width={24} height={24} fill={color} />
    ),
  }}
/>
      <Tabs.Screen
        name="user"
        options={{
          title: '',
          headerShown: false,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
   
  );
}