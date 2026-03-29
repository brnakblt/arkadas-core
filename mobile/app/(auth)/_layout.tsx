import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function AuthLayout() {
  const { user } = useAuthStore();

  // Redirect to login if unauthenticated
  if (!user) {
    return <Redirect href="/" />;
  }

  // Define the inner authenticated navigation
  return (
    <Stack>
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard', headerLeft: () => null }} />
    </Stack>
  );
}
