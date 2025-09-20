import { useAppTheme, useThemeColors, useThemedStyles } from '../contexts/ThemeContext';

// Re-export hooks para facilitar importação
export { useAppTheme, useThemeColors, useThemedStyles };

// Hook adicional para estilos comuns
export function useCommonStyles() {
  return useThemedStyles((colors, isDarkMode) => ({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    surface: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      marginVertical: 4,
      elevation: isDarkMode ? 0 : 1,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDarkMode ? 0 : 0.1,
      shadowRadius: 2,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: colors.outline,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 6,
      elevation: isDarkMode ? 0 : 2,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDarkMode ? 0 : 0.2,
      shadowRadius: 3,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: colors.outline,
    },
    text: {
      color: colors.onSurface,
    },
    title: {
      color: colors.onSurface,
      fontSize: 18,
      fontWeight: 'bold' as const,
    },
    subtitle: {
      color: colors.secondary,
      fontSize: 14,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center' as const,
    },
    buttonText: {
      color: colors.onPrimary,
      fontWeight: 'bold' as const,
      fontSize: 16,
    },
    fab: {
      backgroundColor: colors.primary,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      elevation: 8,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
  }));
}