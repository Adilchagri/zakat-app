import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
// import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          // 'default' provides the native platform feel (smooth push on iOS, etc.)
          // On Android, we can force a slide to ensure consistency or stick to 'default' if it's modern.
          // Using 'slide_from_right' often feels more standard for "page" flow on Android than fade-up.
          animation: Platform.OS === 'android' ? 'slide_from_right' : 'default',
          presentation: 'card',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true, // Smoother back gesture on iOS
          animationDuration: 400, // Slightly slower for "relaxing" feel
          contentStyle: { backgroundColor: '#0a2818' }, // Prevents white flash
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="history" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom', // Explicitly slide up for modal
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}