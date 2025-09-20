import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../contexts/ThemeContext';
import { PaperProvider } from 'react-native-paper';
import { useAppTheme } from '../hooks/useTheme';

function RootLayoutContent() {
  const { theme, navigationTheme, isDarkMode } = useAppTheme();

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="project/[id]" 
          options={{ 
            title: 'Avaliação de Segurança',
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: theme.colors.onPrimary,
          }} 
        />
      </Stack>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}