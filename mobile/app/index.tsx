import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useAuthStore } from '../src/store/authStore';
import { apiFetch } from '../src/lib/api';

export default function Index() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [identifier, setIdentifier] = useState('admin@arkadas.com');
  const [password, setPassword] = useState('Admin123!'); // Dummy credentials
  const [loading, setLoading] = useState(false);

  // If user is already logged in, redirect to the authenticated flow
  if (user) {
    return <Redirect href="/(auth)/dashboard" />;
  }

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Error', 'Please enter both identifier and password.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await apiFetch('/auth/local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      // Save token and user data
      await setUser(response.user, response.jwt);
      router.replace('/(auth)/dashboard');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Check your credentials and connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Arkadaş ERP</Text>
        <Text style={styles.subtitle}>Mobile Portal</Text>

        <TextInput
          style={styles.input}
          placeholder="Email or Username"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8, color: '#333', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 40, textAlign: 'center' },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#4169E1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
