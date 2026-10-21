'use client';

import { PageHeader, Card, Unavailable } from '../_components/ui';

/**
 * Outreach is M2+ in the implementation plan. This page exists so the
 * navigation is truthful, but it says clearly that nothing is implemented.
 * No drafts, no sends, no fabricated success states.
 */
export default function OutreachPage() {
  return (
    <>
      <PageHeader
        title="Outreach"
        subtitle="Contact people at target companies with drafted, approval-gated messages."
      />
      <Card>
        <Unavailable
          feature="Outreach drafting and sending"
          detail="Not implemented in this milestone. No contacts have been found, no drafts exist, and no messages have been or will be sent from this account. The approval-gated pipeline (draft → review → hash-bound approval → single-use send) is designed in the specification and lands in a later phase."
        />
      </Card>
      <Card className="mt-4">
        <Unavailable
          feature="Gmail / LinkedIn connections"
          detail="No external accounts are connected. The Gmail integration has not been provisioned, and nothing requests OAuth in this milestone."
        />
      </Card>
    </>
  );
}
