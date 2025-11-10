import { Stack } from 'expo-router';

export default function PlanLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="bot" options={{ title: 'Plan Your Trip' }} />
    </Stack>
  );
}

