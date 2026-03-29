import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Image, TouchableOpacity, Linking } from 'react-native';
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
        tabBarShowIcon: true,
        tabBarStyle: {
          backgroundColor: Colors.card,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          height: 70 + (insets.bottom > 0 ? insets.bottom : 0),
          borderTopWidth: 0,
          elevation: 0,
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
        <View style={{ flex: 1 }}>
          <MyTabs />
          <View style={{
            position: 'absolute',
            bottom: 40,
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}>
            <Text style={{ color: Colors.textMuted, fontSize: 10, opacity: 1 }}>
              Powered by
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://www.coingecko.com/en/api')}>
              <Image
                source={require('./images/CGAPI-Lockup@2x-1.png')}
                style={{ width: 100, height: 25 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}