import { Screen, Unavailable } from '../components';

export function OutreachScreen() {
  return (
    <Screen
      title="Outreach"
      subtitle="Contact people at target companies with drafted, approval-gated messages."
    >
      <Unavailable
        feature="Outreach drafting and sending"
        detail="Not implemented in this milestone. No contacts have been found, no drafts exist, and no messages have been or will be sent. The approval-gated pipeline (draft → review → hash-bound approval → single-use send) lands in a later phase."
      />
      <Unavailable
        feature="Gmail / LinkedIn connections"
        detail="No external accounts are connected. Nothing requests OAuth in this milestone."
      />
    </Screen>
  );
}
