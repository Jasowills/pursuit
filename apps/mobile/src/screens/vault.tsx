import { Text, View } from 'react-native';
import { useResource } from '../use-resource';
import { Card, Empty, ErrorView, Loading, Pill, Screen, Unavailable } from '../components';
import { colors, spacing } from '../theme';

interface VersionsResponse {
  items: {
    id: string;
    label: string;
    status: string;
    template_version: string;
    is_submitted: boolean;
  }[];
}

export function VaultScreen() {
  const versions = useResource<VersionsResponse>('/resumes/versions');

  return (
    <Screen title="Resume Vault" subtitle="Versioned, tailored resumes with review status.">
      {versions.loading ? (
        <Loading label="Loading resume versions…" />
      ) : versions.error ? (
        <ErrorView error={versions.error} onRetry={versions.reload} />
      ) : (versions.data?.items.length ?? 0) === 0 ? (
        <Empty>No resume versions recorded yet.</Empty>
      ) : (
        versions.data?.items.map((v) => (
          <Card key={v.id}>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}
            >
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                {v.label}
              </Text>
              <Pill status={v.status} />
            </View>
            <Text style={{ marginTop: 2, fontSize: 11, color: colors.muted }}>
              template {v.template_version}
              {v.is_submitted ? ' · submitted' : ''}
            </Text>
          </Card>
        ))
      )}
      <Unavailable
        feature="Resume upload & tailoring"
        detail="Upload, generation, and download are not wired in this milestone — the vault only lists versions recorded through the API."
      />
    </Screen>
  );
}
