import { Stack } from 'expo-router';

export default function SupportLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="create" options={{ title: 'Report Issue' }} />
      <Stack.Screen name="emergency" options={{ title: 'Emergency Help' }} />
    </Stack>
  );
}

