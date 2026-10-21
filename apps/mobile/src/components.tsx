import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, spacing, statusTone } from './theme';

export function Screen({
  title,
  subtitle,
  children,
  scroll = true,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
}) {
  const body = (
    <View style={styles.screenInner}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={{ height: spacing.lg }} />
      {children}
      <View style={{ height: spacing.xxl }} />
    </View>
  );
  if (!scroll) return <View style={styles.screen}>{body}</View>;
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      {body}
    </ScrollView>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Pill({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <View style={[styles.pill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <Text style={[styles.pillText, { color: tone.fg }]}>
        {status.replaceAll('_', ' ').toLowerCase()}
      </Text>
    </View>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.centerBox}>
      <ActivityIndicator color={colors.foreground} />
      <Text style={styles.mutedText}>{label}</Text>
    </View>
  );
}

export function ErrorView({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : String(error);
  const unauthorized = message.includes('missing_bearer') || message.includes('invalid_or_expired');
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorTitle}>
        {unauthorized ? 'Session expired or missing' : 'Request failed'}
      </Text>
      <Text style={styles.errorBody}>{message}</Text>
      {onRetry && !unauthorized ? (
        <Pressable onPress={onRetry} style={styles.linkButton}>
          <Text style={styles.linkText}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <View style={styles.emptyBox}>
      <Text style={styles.mutedText}>{children}</Text>
    </View>
  );
}

/** Honest marker for capabilities not implemented in this milestone. */
export function Unavailable({ feature, detail }: { feature: string; detail: string }) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>⏳ {feature} — not available yet</Text>
      <Text style={styles.noticeBody}>{detail}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.primaryButton, (pressed || disabled) && { opacity: 0.7 }]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  hint?: string;
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        style={styles.input}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  screenInner: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  title: { fontSize: 26, fontWeight: '700', color: colors.foreground, letterSpacing: -0.5 },
  subtitle: { marginTop: spacing.xs, fontSize: 14, lineHeight: 20, color: colors.mutedForeground },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  pillText: { fontSize: 11, fontWeight: '600' },
  centerBox: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  mutedText: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center' },
  errorBox: {
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorTitle: { fontSize: 14, fontWeight: '600', color: colors.danger },
  errorBody: { marginTop: 4, fontSize: 13, color: colors.danger },
  linkButton: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
    color: colors.foreground,
  },
  emptyBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  notice: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  noticeTitle: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  noticeBody: { marginTop: 4, fontSize: 13, lineHeight: 19, color: colors.mutedForeground },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: { color: colors.primaryForeground, fontSize: 15, fontWeight: '600' },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: colors.foreground, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.foreground,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    fontSize: 15,
  },
  hint: { marginTop: 4, fontSize: 12, color: colors.muted },
});
