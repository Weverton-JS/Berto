import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useTheme';

export default function TabLayout() {
  const { theme } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.outline,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Projetos',
          tabBarLabel: 'Gallery',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="photo-library" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Câmera',
          tabBarLabel: 'Camera',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="photo-camera" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}