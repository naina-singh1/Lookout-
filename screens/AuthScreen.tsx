// screens/AuthScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { C, R } from '../constants/theme';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      Alert.alert('Enter your email first', 'Type your email above and tap Forgot password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Email sent', 'Check your inbox for a password reset link.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>

          {/* Logo */}
          <View style={styles.logoRow}>
            <View style={styles.iconTile}>
              <Text style={{ fontSize: 18, color: '#fff' }}>⚠</Text>
            </View>
            <Text style={styles.wordmark}>
              <Text style={{ color: C.textPrimary }}>Look</Text>
              <Text style={{ color: C.accent }}>out</Text>
            </Text>
          </View>

          {/* Toggle pill */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'login' && styles.toggleActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>
                Log in
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'signup' && styles.toggleActive]}
              onPress={() => setMode('signup')}
            >
              <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>
                Sign up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </Text>
            <Text style={styles.cardSub}>
              {mode === 'login'
                ? 'Log in to report and track potholes'
                : 'Join the community keeping roads safer'}
            </Text>

            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={C.textFaint}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={C.textFaint}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={C.textFaint}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {mode === 'login' && (
              <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>
                    {mode === 'login' ? 'Log in' : 'Create account'}
                  </Text>
              }
            </TouchableOpacity>
          </View>

          {/* Switch mode */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              <Text style={styles.switchLink}>
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 36,
  },
  iconTile: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.surface, borderWidth: 0.5,
    borderColor: C.borderSubtle, alignItems: 'center',
    justifyContent: 'center', marginRight: 10,
  },
  wordmark: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -1,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: R.pill,
    borderWidth: 0.5,
    borderColor: C.borderSubtle,
    padding: 4,
    marginBottom: 28,
  },
  toggleBtn: {
    paddingHorizontal: 28,
    paddingVertical: 8,
    borderRadius: R.pill,
  },
  toggleActive: {
    backgroundColor: C.accent,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: C.textMuted,
  },
  toggleTextActive: {
    color: '#fff',
  },
  card: {
    width: '100%',
    backgroundColor: C.surface,
    borderRadius: R.card,
    borderWidth: 0.5,
    borderColor: C.borderSubtle,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: C.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: C.elevated,
    borderRadius: R.button,
    borderWidth: 0.5,
    borderColor: C.borderMuted,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.textPrimary,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  forgotText: {
    fontSize: 12,
    color: C.accent,
  },
  primaryBtn: {
    backgroundColor: C.accent,
    borderRadius: R.button,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 13,
    color: C.textSecondary,
  },
  switchLink: {
    fontSize: 13,
    color: C.accent,
    fontWeight: '600',
  },
});
