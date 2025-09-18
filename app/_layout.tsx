import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1e40af',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
                <Stack.Screen 
          name="index" 
          options={{ 
            title: 'RELATÓRIO DE INSPEÇÃO',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="create-project" 
          options={{ 
            title: 'Novo Projeto',
            presentation: 'modal' 
          }} 
        />
        <Stack.Screen 
          name="project/[id]" 
          options={{ 
            title: 'Avaliação de Segurança' 
          }} 
        />
      </Stack>
    </>
  );
}