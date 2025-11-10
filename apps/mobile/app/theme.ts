import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0066CC',
    secondary: '#FFA000',
    tertiary: '#00BFA5',
    error: '#D32F2F',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    // High contrast mode colors
    onPrimary: '#FFFFFF',
    onSecondary: '#000000',
    onSurface: '#000000',
    onBackground: '#000000',
  },
  // Larger touch targets
  roundness: 8,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#4D9FFF',
    secondary: '#FFB74D',
    tertiary: '#4DD0C0',
    error: '#EF5350',
    // Ensure sufficient contrast in dark mode
    onPrimary: '#000000',
    onSecondary: '#000000',
    onSurface: '#FFFFFF',
    onBackground: '#FFFFFF',
  },
  roundness: 8,
};

export function useAppTheme() {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
}

// Default export for backward compatibility
export const theme = lightTheme;

