// App.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './services/firebase';

import MapScreen from './screens/MapScreen';
import FeedScreen from './screens/FeedScreen';
import RouteScreen from './screens/RouteScreen';
import ProfileScreen from './screens/ProfileScreen';
import AuthScreen from './screens/AuthScreen';

import { C } from './constants/theme';

const Tab = createBottomTabNavigator();

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 6 }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.35 }}>{icon}</Text>
      <Text style={{ fontSize: 10, color: focused ? C.accent : C.textMuted, marginTop: 3 }}>
        {label}
      </Text>
    </View>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return unsubscribe;
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0e0e12',
            borderTopWidth: 0.5,
            borderTopColor: '#1e1e28',
            height: 70,
            paddingBottom: 10,
          },
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon icon="🗺" label="Map" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Feed"
          component={FeedScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon icon="📋" label="Feed" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Route"
          component={RouteScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon icon="🛣" label="Route" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profile" focused={focused} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
