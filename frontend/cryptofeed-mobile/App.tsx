import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// 1. Import the Icon library
import { Ionicons } from '@expo/vector-icons'; 

import DashboardScreen from './screens/DashboardScreen';
import ProfileScreen from './screens/ProfilesScreen';
import { Colors } from './constants/theme';

const Tab = createMaterialTopTabNavigator();

function MyTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Market"
      tabBarPosition="bottom"
      screenOptions={({ route }) => ({
        // 2. Logic to choose the icon based on the route name
        tabBarIcon: ({ color }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Market') {
            iconName = 'stats-chart';
          } else if (route.name === 'Profile') {
            iconName = 'person-circle';
          } else {
            iconName = 'help-circle';
          }

          return <Ionicons name={iconName} size={20} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarIndicatorStyle: { backgroundColor: Colors.primary, top: 0 },
        tabBarShowIcon: true, // Required for Top Tabs to show icons
        tabBarStyle: { 
          backgroundColor: Colors.card,
          // Fixed overlap by adding inset padding
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10, 
          height: 70 + (insets.bottom > 0 ? insets.bottom : 0),
          borderTopWidth: 0,
          elevation: 0, // Removes shadow on Android
        },
        tabBarLabelStyle: { fontWeight: 'bold', fontSize: 11, marginBottom: 5 },
      })}
    >
      <Tab.Screen name="Market" component={DashboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <MyTabs />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}