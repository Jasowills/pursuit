import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AUTO_TOOLS } from '@pursuit/shared';
import { apiFetch } from '../api';
import { useResource } from '../use-resource';
import {
  Card,
  ErrorView,
  Loading,
  Pill,
  PrimaryButton,
  Screen,
  TextField,
  Unavailable,
} from '../components';
import { colors, spacing } from '../theme';

interface RunsResponse {
  items: {
    id: string;
    goal: string;
    status: string;
    runtime: string;
    steps: { id: string; tool: string; status: string }[];
  }[];
}

export function AgentScreen() {
  const runs = useResource<RunsResponse>('/agent/runs');
  const [goal, setGoal] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function startRun() {
    setBusy(true);
    setMessage(null);
    try {
      await apiFetch('/agent/runs', {
        method: 'POST',
        json: { goal, allowed_tools: [...AUTO_TOOLS], context_refs: [] },
      });
      setGoal('');
      runs.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      title="Agent"
      subtitle="Proposal-only agent. Nothing is submitted or sent directly — the agent proposes, you decide."
    >
      <Card>
        <Text style={styles.bodyText}>
          Runtime “dev” is deterministic and model-free: every tool step passes through the policy
          gateway and is recorded BLOCKED_BY_POLICY. Real model runs require a provider decision and
          are not enabled here.
        </Text>
      </Card>

      <Card>
        <TextField
          label="Goal"
          value={goal}
          onChangeText={setGoal}
          placeholder="Find senior engineering roles in my pipeline"
        />
        {message ? <Text style={styles.error}>{message}</Text> : null}
        <PrimaryButton
          label={busy ? 'Starting…' : 'Start run'}
          onPress={startRun}
          disabled={busy || goal.trim().length < 4}
        />
      </Card>

      <Text style={styles.sectionTitle}>Run history</Text>
      {runs.loading ? (
        <Loading label="Loading runs…" />
      ) : runs.error ? (
        <ErrorView error={runs.error} onRetry={runs.reload} />
      ) : (runs.data?.items.length ?? 0) === 0 ? (
        <Text style={styles.muted}>No runs yet.</Text>
      ) : (
        runs.data?.items.map((r) => (
          <Card key={r.id}>
            <View style={styles.row}>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {r.goal}
              </Text>
              <Pill status={r.status} />
            </View>
            <Text style={styles.meta}>{r.runtime}</Text>
            {r.steps.map((s) => (
              <View key={s.id} style={styles.stepRow}>
                <Text style={styles.stepTool}>{s.tool}</Text>
                <Text
                  style={[
                    styles.stepStatus,
                    {
                      color:
                        s.status === 'BLOCKED_BY_POLICY'
                          ? colors.warning
                          : s.status === 'SUCCEEDED'
                            ? colors.success
                            : colors.danger,
                    },
                  ]}
                >
                  {s.status}
                </Text>
              </View>
            ))}
          </Card>
        ))
      )}

      <Unavailable
        feature="Real model analysis"
        detail="The OpenCode adapter exists behind AGENT_RUNTIME=opencode, but a model provider decision is still open — no paid or non-personal provider is used."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bodyText: { fontSize: 13, lineHeight: 19, color: colors.mutedForeground },
  sectionTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
  },
  muted: { fontSize: 14, color: colors.mutedForeground },
  error: { marginBottom: spacing.sm, fontSize: 13, color: colors.danger },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  itemTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.foreground },
  meta: { marginTop: 2, marginBottom: 6, fontSize: 11, color: colors.muted },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1 },
  stepTool: { fontSize: 11, fontFamily: 'Courier', color: colors.mutedForeground },
  stepStatus: { fontSize: 11, fontFamily: 'Courier' },
});
