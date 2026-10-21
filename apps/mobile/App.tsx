import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { clearToken, getToken } from './src/api';
import { colors, spacing } from './src/theme';
import { LoginScreen } from './src/screens/login';
import { HomeScreen } from './src/screens/home';
import { JobsScreen } from './src/screens/jobs';
import { AgentScreen } from './src/screens/agent';
import { OutreachScreen } from './src/screens/outreach';
import { VaultScreen } from './src/screens/vault';

type Tab = 'home' | 'jobs' | 'agent' | 'outreach' | 'vault';

const TABS: ReadonlyArray<readonly [Tab, string]> = [
  ['home', 'Home'],
  ['jobs', 'Jobs'],
  ['agent', 'Agent'],
  ['outreach', 'Outreach'],
  ['vault', 'Vault'],
];

export default function App() {
  const [booting, setBooting] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>('home');

  useEffect(() => {
    getToken()
      .then((token) => setAuthed(Boolean(token)))
      .finally(() => setBooting(false));
  }, []);

  const signOut = useCallback(async () => {
    await clearToken();
    setAuthed(false);
    setTab('home');
  }, []);

  if (booting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.foreground} />
      </View>
    );
  }

  if (!authed) {
    return (
      <>
        <ExpoStatusBar style="dark" />
        <SafeAreaView style={styles.safe}>
          <LoginScreen onSignedIn={() => setAuthed(true)} />
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <ExpoStatusBar style="dark" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.appBody}>
          {tab === 'home' && <HomeScreen onSignOut={signOut} />}
          {tab === 'jobs' && <JobsScreen />}
          {tab === 'agent' && <AgentScreen />}
          {tab === 'outreach' && <OutreachScreen />}
          {tab === 'vault' && <VaultScreen />}
        </View>
        <View style={styles.tabBar} accessibilityRole="tablist">
          {TABS.map(([id, label]) => {
            const active = tab === id;
            return (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setTab(id)}
                style={styles.tab}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
                {active ? <View style={styles.tabIndicator} /> : <View style={styles.tabSpacer} />}
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  appBody: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    paddingBottom: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    minHeight: 52,
  },
  tabLabel: { fontSize: 12, fontWeight: '500', color: colors.muted },
  tabLabelActive: { color: colors.foreground, fontWeight: '700' },
  tabIndicator: {
    marginTop: 4,
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.foreground,
  },
  tabSpacer: { marginTop: 4, width: 16, height: 2 },
});
