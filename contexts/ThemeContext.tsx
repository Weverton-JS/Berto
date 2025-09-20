import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, adaptNavigationTheme } from 'react-native-paper';
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';

// Definir cores customizadas
const customLightColors = {
  ...MD3LightTheme.colors,
  primary: '#1e40af',
  primaryContainer: '#eff6ff',
  secondary: '#64748b',
  tertiary: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  surface: '#f8fafc',
  surfaceVariant: '#f1f5f9',
  outline: '#e2e8f0',
  background: '#ffffff',
  onBackground: '#1e293b',
  onSurface: '#1e293b',
};

const customDarkColors = {
  ...MD3DarkTheme.colors,
  primary: '#3b82f6',
  primaryContainer: '#1e40af',
  secondary: '#94a3b8',
  tertiary: '#34d399',
  error: '#f87171',
  warning: '#fbbf24',
  success: '#34d399',
  surface: '#1e293b',
  surfaceVariant: '#334155',
  outline: '#475569',
  background: '#0f172a',
  onBackground: '#f8fafc',
  onSurface: '#f8fafc',
};

const lightTheme = {
  ...MD3LightTheme,
  colors: customLightColors,
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: customDarkColors,
};

// Adaptar temas de navegação
const { LightTheme: AdaptedLightTheme, DarkTheme: AdaptedDarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
  materialLight: lightTheme,
  materialDark: darkTheme,
});

interface ThemeContextType {
  theme: typeof lightTheme;
  navigationTheme: typeof AdaptedLightTheme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  
  // Determinar se está no modo escuro
  const isDarkMode = themeMode === 'system' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark';
  
  // Selecionar tema baseado no modo
  const theme = isDarkMode ? darkTheme : lightTheme;
  const navigationTheme = isDarkMode ? AdaptedDarkTheme : AdaptedLightTheme;
  
  // Toggle entre light e dark (não system)
  const toggleTheme = () => {
    setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
  };
  
  // Atualizar status bar baseado no tema
  useEffect(() => {
    StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
  }, [isDarkMode]);

  const value: ThemeContextType = {
    theme,
    navigationTheme,
    isDarkMode,
    toggleTheme,
    themeMode,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook simplificado para acessar apenas as cores
export function useThemeColors() {
  const { theme } = useAppTheme();
  return theme.colors;
}

// Hook para estilos dinâmicos
export function useThemedStyles<T>(styleFunction: (colors: typeof customLightColors, isDarkMode: boolean) => T): T {
  const { theme, isDarkMode } = useAppTheme();
  return styleFunction(theme.colors, isDarkMode);
}