import { Text, View } from 'react-native';
import { useResource } from '../use-resource';
import { Card, Empty, ErrorView, Loading, Pill, Screen } from '../components';
import { colors, spacing } from '../theme';

interface JobsResponse {
  items: {
    job: { id: string; title: string; company_name: string; location: string | null };
    match: { eligibility: string; fit_score: number } | null;
  }[];
}

export function JobsScreen() {
  const jobs = useResource<JobsResponse>('/jobs');

  return (
    <Screen
      title="Jobs"
      subtitle="Manually added postings with eligibility scoring. Watcher execution and automated discovery are not available yet."
    >
      {jobs.loading ? (
        <Loading label="Loading jobs…" />
      ) : jobs.error ? (
        <ErrorView error={jobs.error} onRetry={jobs.reload} />
      ) : (jobs.data?.items.length ?? 0) === 0 ? (
        <Empty>No jobs yet — add them from the web dashboard in this milestone.</Empty>
      ) : (
        jobs.data?.items.map(({ job, match }) => (
          <Card key={job.id}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
              {job.title}
            </Text>
            <Text style={{ marginTop: 2, fontSize: 12, color: colors.mutedForeground }}>
              {job.company_name}
              {job.location ? ` · ${job.location}` : ''}
            </Text>
            {match ? (
              <View style={{ marginTop: spacing.sm }}>
                <Pill status={match.eligibility} />
                <Text style={{ marginTop: 6, fontSize: 12, color: colors.mutedForeground }}>
                  Fit score {match.fit_score} · UNKNOWN eligibility is never treated as a pass.
                </Text>
              </View>
            ) : (
              <Text style={{ marginTop: 6, fontSize: 12, color: colors.muted }}>
                No eligibility analysis recorded.
              </Text>
            )}
          </Card>
        ))
      )}
    </Screen>
  );
}
