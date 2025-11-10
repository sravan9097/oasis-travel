import { Stack } from 'expo-router';

export default function TripLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="[id]" options={{ title: 'Trip Details' }} />
    </Stack>
  );
}

