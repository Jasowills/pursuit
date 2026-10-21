import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useResource } from '../use-resource';
import { Card, Empty, ErrorView, Loading, Pill, Screen, Unavailable } from '../components';
import { colors, spacing } from '../theme';

interface ProfileResponse {
  user: { display_name: string; email: string };
  tenant_id: string;
  profile: { location: string | null; role_families: string[] };
}
interface AppsResponse {
  items: { id: string; job_title: string; company_name: string; status: string }[];
}
interface RunsResponse {
  items: { id: string; goal: string; status: string }[];
}
interface WatchersResponse {
  items: { id: string; enabled: boolean }[];
}
interface NotesResponse {
  items: { id: string; read_at: string | null }[];
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function HomeScreen({ onSignOut }: { onSignOut: () => void }) {
  const profile = useResource<ProfileResponse>('/profile');
  const apps = useResource<AppsResponse>('/applications');
  const runs = useResource<RunsResponse>('/agent/runs');
  const watchers = useResource<WatchersResponse>('/watchers');
  const notes = useResource<NotesResponse>('/notifications');

  if (profile.loading) return <Loading label="Loading your dashboard…" />;
  if (profile.error) return <ErrorView error={profile.error} onRetry={profile.reload} />;
  if (!profile.data) return null;

  const openApps = apps.data?.items ?? [];
  const activeRuns = (runs.data?.items ?? []).filter((r) => r.status === 'RUNNING').length;
  const unread = (notes.data?.items ?? []).filter((n) => !n.read_at).length;
  const enabledWatchers = (watchers.data?.items ?? []).filter((w) => w.enabled).length;

  return (
    <Screen
      title={`Welcome, ${profile.data.user.display_name}`}
      subtitle="Your job search at a glance. You approve anything that leaves the building."
    >
      <View style={styles.statsRow}>
        <Stat label="APPLICATIONS" value={openApps.length} />
        <Stat label="AGENT RUNS" value={runs.data?.items.length ?? 0} />
        <Stat label="WATCHERS" value={enabledWatchers} />
        <Stat label="UNREAD" value={unread} />
      </View>

      <Text style={styles.sectionTitle}>Recent applications</Text>
      {apps.loading ? (
        <Loading />
      ) : apps.error ? (
        <ErrorView error={apps.error} onRetry={apps.reload} />
      ) : openApps.length === 0 ? (
        <Empty>No applications yet — add jobs under the Jobs tab.</Empty>
      ) : (
        openApps.slice(0, 3).map((a) => (
          <Card key={a.id}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1, paddingRight: spacing.sm }}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {a.job_title}
                </Text>
                <Text style={styles.itemMeta} numberOfLines={1}>
                  {a.company_name}
                </Text>
              </View>
              <Pill status={a.status} />
            </View>
          </Card>
        ))
      )}

      <Text style={styles.sectionTitle}>Agent activity</Text>
      {runs.loading ? (
        <Loading />
      ) : (runs.data?.items.length ?? 0) === 0 ? (
        <Empty>No agent runs yet.</Empty>
      ) : (
        (runs.data?.items ?? []).slice(0, 3).map((r) => (
          <Card key={r.id}>
            <View style={styles.rowBetween}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {r.goal}
              </Text>
              <Pill status={r.status} />
            </View>
          </Card>
        ))
      )}

      <Text style={styles.sectionTitle}>Not yet available</Text>
      <Unavailable
        feature="Outreach"
        detail="Drafting and sending contact messages is not implemented. Nothing has been or will be emailed on your behalf."
      />
      <Unavailable
        feature="Push notifications"
        detail="Notifications are in-app only. Nothing is pushed to this device in this milestone."
      />
      <Unavailable
        feature="Resume upload"
        detail="The vault lists versions recorded through the API; upload lands in a later phase."
      />

      <Pressable onPress={onSignOut} style={styles.signOut} accessibilityRole="button">
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
      <Text style={styles.footnote}>
        Tenant {profile.data.tenant_id.slice(0, 8)}… · runtime “dev”
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  stat: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.md,
  },
  statLabel: { fontSize: 10, letterSpacing: 0.6, color: colors.muted },
  statValue: { marginTop: 2, fontSize: 22, fontWeight: '700', color: colors.foreground },
  sectionTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemTitle: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  itemMeta: { marginTop: 2, fontSize: 12, color: colors.mutedForeground },
  signOut: {
    marginTop: spacing.md,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: { fontSize: 14, fontWeight: '500', color: colors.foreground },
  footnote: { marginTop: spacing.md, fontSize: 11, color: colors.muted, textAlign: 'center' },
});
