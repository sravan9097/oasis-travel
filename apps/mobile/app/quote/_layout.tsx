import { Stack } from 'expo-router';

export default function QuoteLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="[id]" options={{ title: 'Quote Details' }} />
      <Stack.Screen name="compare" options={{ title: 'Compare Quotes' }} />
    </Stack>
  );
}

