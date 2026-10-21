import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiFetch, LoginResponse, setToken } from '../api';
import { colors, spacing } from '../theme';
import { PrimaryButton, TextField } from '../components';

export function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<LoginResponse>('/auth/dev-login', {
        method: 'POST',
        json: { email, display_name: displayName },
      });
      await setToken(res.token);
      onSignedIn();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Sign-in failed: ${err.message}. Is the API reachable at the configured API URL?`
          : 'Sign-in failed.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>pursuit.</Text>
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.subtitle}>
          Dev sign-in creates a personal tenant and a 7-day session. Nothing is sent anywhere and no
          external account is contacted.
        </Text>
        <View style={{ height: spacing.xl }} />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
        />
        <TextField
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
        />
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <PrimaryButton
          label={busy ? 'Signing in…' : 'Continue'}
          onPress={submit}
          disabled={busy || !email || !displayName}
        />
        <Text style={styles.footnote}>
          Dev-only authentication. Production auth providers are not configured in this milestone.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  inner: { padding: spacing.xl, paddingTop: 96, maxWidth: 480, width: '100%', alignSelf: 'center' },
  brand: { fontSize: 22, fontWeight: '700', color: colors.foreground, marginBottom: spacing.xl },
  title: { fontSize: 26, fontWeight: '700', color: colors.foreground, letterSpacing: -0.5 },
  subtitle: { marginTop: spacing.sm, fontSize: 14, lineHeight: 20, color: colors.mutedForeground },
  errorBox: {
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerBg,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { fontSize: 13, color: colors.danger },
  footnote: {
    marginTop: spacing.lg,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    textAlign: 'center',
  },
});
