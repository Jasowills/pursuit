import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useResource } from '../use-resource';
import { Card, Empty, ErrorView, Loading, Pill, Screen } from '../components';
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

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function HomeScreen({
  onSignOut,
  onNavigate,
}: {
  onSignOut: () => void;
  onNavigate: (tab: 'jobs' | 'agent' | 'vault') => void;
}) {
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
      title={`Today, ${profile.data.user.display_name.split(' ')[0]}`}
      subtitle="Your applications, documents and background work."
    >
      <View style={styles.searchHeader}>
        <Text style={styles.searchHeading}>
          {activeRuns
            ? `${activeRuns} task${activeRuns === 1 ? '' : 's'} running`
            : 'Your search, in one place.'}
        </Text>
        <Text style={styles.searchDetail}>
          Check an opportunity, follow an application or return to your documents.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => onNavigate('jobs')}
          style={styles.openJobs}
        >
          <Text style={styles.openJobsText}>Review opportunities</Text>
        </Pressable>
      </View>
      <View style={styles.statsRow}>
        <Stat label="APPLICATIONS" value={apps.data ? openApps.length : '—'} />
        <Stat label="AGENT RUNS" value={runs.data ? runs.data.items.length : '—'} />
        <Stat label="WATCHERS" value={watchers.data ? enabledWatchers : '—'} />
        <Stat label="UNREAD" value={notes.data ? unread : '—'} />
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
      ) : runs.error ? (
        <ErrorView error={runs.error} onRetry={runs.reload} />
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

      <View style={styles.capabilityNote}>
        <Text style={styles.searchDetail}>
          Connected to your API workspace. Device pairing, push notifications and mobile approval
          are not available yet.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => onNavigate('vault')}
          style={styles.documentLink}
        >
          <Text style={styles.itemTitle}>Open your document vault</Text>
        </Pressable>
      </View>

      <Pressable onPress={onSignOut} style={styles.signOut} accessibilityRole="button">
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchHeader: {
    padding: 20,
    marginTop: 22,
    marginBottom: 20,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchHeading: {
    fontSize: 23,
    letterSpacing: -0.6,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: 14,
  },
  searchDetail: { fontSize: 13, lineHeight: 20, color: colors.mutedForeground, marginTop: 8 },
  openJobs: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  openJobsText: { color: colors.primaryForeground, fontSize: 13, fontWeight: '600' },
  capabilityNote: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 16,
  },
  documentLink: { minHeight: 46, justifyContent: 'center', marginTop: 8 },
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
