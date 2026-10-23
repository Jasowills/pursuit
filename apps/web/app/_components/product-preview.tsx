import { Icon, type IconName } from './icons';
import { PursuitMark, Wordmark } from './header';

export type Scene = 'overview' | 'discover' | 'qualify' | 'approve' | 'track';

const SCENE_PATH: Record<Scene, string> = {
  overview: '',
  discover: '/jobs',
  qualify: '/jobs/examplecorp-senior-growth',
  approve: '/applications/approval',
  track: '/applications/examplecorp-senior-growth',
};

function MiniStatus({
  tone,
  children,
}: {
  tone: 'muted' | 'signal' | 'success' | 'warning' | 'danger' | 'solid';
  children: React.ReactNode;
}) {
  return <span className={`stamp stamp-${tone}`}>{children}</span>;
}

function Avatar({
  initials,
  tone,
}: {
  initials: string;
  tone?: 'brand' | 'lime' | 'warm' | 'teal' | 'rose';
}) {
  return (
    <span className="mini-avatar" data-tone={tone ?? 'brand'}>
      {initials}
    </span>
  );
}

function Rail({ scene }: { scene: Scene }) {
  const jobsActive = scene === 'discover' || scene === 'qualify';
  const appsActive = scene === 'approve' || scene === 'track';

  return (
    <aside className="preview-rail">
      <div className="preview-brand">
        <PursuitMark size={18} />
        <Wordmark />
        <span className="preview-brand-tag">M1</span>
      </div>

      <div className="preview-workspace">
        <span className="preview-workspace-avatar">DO</span>
        <div className="preview-workspace-copy">
          <div className="preview-workspace-name">Demo Operator</div>
          <div className="preview-workspace-meta">Personal workspace</div>
        </div>
      </div>

      <nav className="preview-nav" aria-label="Preview navigation">
        <div className="preview-nav-label">Workspace</div>
        <span className="preview-nav-item" data-active={scene === 'overview'}>
          <Icon name="home" size={12} />
          Overview
        </span>
        <span className="preview-nav-item" data-active={jobsActive}>
          <Icon name="briefcase" size={12} />
          Jobs
          <span className="preview-nav-count">5</span>
        </span>
        <span className="preview-nav-item" data-active={appsActive}>
          <Icon name="layers" size={12} />
          Applications
          <span className="preview-nav-count">3</span>
        </span>
        <span className="preview-nav-item">
          <Icon name="sparkles" size={12} />
          Agent
          <span className="preview-nav-count">1</span>
        </span>

        <div className="preview-nav-label" style={{ marginTop: 10 }}>
          Library
        </div>
        <span className="preview-nav-item">
          <Icon name="send" size={12} />
          Outreach
        </span>
        <span className="preview-nav-item">
          <Icon name="folder" size={12} />
          Resume Vault
        </span>
      </nav>

      <div className="preview-rail-card">
        <div className="preview-rail-card-top">
          <span className="live-dot" />
          Agent idle
        </div>
        <p>Proposal-only · dev runtime. Nothing sends itself.</p>
      </div>
    </aside>
  );
}

function OverviewScene() {
  return (
    <>
      <div className="preview-head">
        <div>
          <div className="preview-head-title">Good evening, Demo.</div>
          <div className="preview-head-sub">
            Three things need your attention. Every record is inspectable.
          </div>
        </div>
        <div className="preview-head-actions">
          <span className="mini-btn">Wed 21 Oct</span>
          <span className="mini-btn mini-btn-dark">
            <Icon name="sparkles" size={10} />
            Run agent
          </span>
        </div>
      </div>

      <div className="preview-stats">
        <div className="mini-stat" data-tone="brand">
          <div className="mini-stat-label">Open roles</div>
          <div className="mini-stat-value">5</div>
          <div className="mini-stat-hint">2 need review</div>
        </div>
        <div className="mini-stat" data-tone="lime">
          <div className="mini-stat-label">Applications</div>
          <div className="mini-stat-value">3</div>
          <div className="mini-stat-hint">1 ready for approval</div>
        </div>
        <div className="mini-stat" data-tone="warm">
          <div className="mini-stat-label">Awaiting you</div>
          <div className="mini-stat-value">1</div>
          <div className="mini-stat-hint">Single-use approval</div>
        </div>
      </div>

      <div className="preview-grid">
        <div>
          <div className="mini-next">
            <div className="mini-next-top">
              <span>Next move</span>
              <span className="mini-next-pill">1 approval</span>
            </div>
            <h4>Review the exact payload before anything leaves the building.</h4>
            <p className="mini-next-meta">Senior Software Engineer, Growth · ExampleCorp</p>
            <div className="mini-next-foot">
              <span>HASH-BOUND · SINGLE USE</span>
              <span className="mini-next-button">
                Open approval <Icon name="arrowUpRight" size={8} />
              </span>
            </div>
          </div>

          <div className="mini-panel mini-pipeline">
            <div className="mini-panel-head">
              <span className="mini-panel-title">Pipeline</span>
              <span className="mini-panel-link">View all</span>
            </div>
            <div className="mini-panel-body">
              <div className="mini-row">
                <Avatar initials="EC" />
                <div className="mini-row-copy">
                  <div className="mini-row-title">Senior Software Engineer, Growth</div>
                  <div className="mini-row-meta">ExampleCorp · Remote, US</div>
                </div>
                <MiniStatus tone="warning">Ready for review</MiniStatus>
              </div>
              <div className="mini-row">
                <Avatar initials="GW" tone="lime" />
                <div className="mini-row-copy">
                  <div className="mini-row-title">Platform Engineer II</div>
                  <div className="mini-row-meta">GraphiteWorks · Austin, TX</div>
                </div>
                <MiniStatus tone="success">Qualified</MiniStatus>
              </div>
              <div className="mini-row">
                <Avatar initials="TV" tone="teal" />
                <div className="mini-row-copy">
                  <div className="mini-row-title">Full-stack Engineer, Product</div>
                  <div className="mini-row-meta">TerraVine · Remote</div>
                </div>
                <MiniStatus tone="muted">Discovered</MiniStatus>
              </div>
            </div>
          </div>
        </div>

        <div className="preview-side">
          <div className="mini-panel">
            <div className="mini-panel-head">
              <span className="mini-panel-title">Agent run</span>
              <span className="mini-panel-link">View trace</span>
            </div>
            <div className="mini-panel-body">
              <div className="mini-run-head">
                <span className="mini-run-status">
                  <span className="live-dot" />
                  Awaiting approval
                </span>
                <span className="mini-row-date">dev</span>
              </div>
              <div className="mini-step" data-state="done">
                <span className="mini-step-dot" />
                <div className="mini-step-copy">
                  <div className="mini-step-name">search_jobs</div>
                  <div className="mini-step-note">5 records read</div>
                </div>
              </div>
              <div className="mini-step" data-state="done">
                <span className="mini-step-dot" />
                <div className="mini-step-copy">
                  <div className="mini-step-name">score_job</div>
                  <div className="mini-step-note">Eligibility recorded</div>
                </div>
              </div>
              <div className="mini-step" data-state="blocked">
                <span className="mini-step-dot" />
                <div className="mini-step-copy">
                  <div className="mini-step-name">submit_application</div>
                  <div className="mini-step-note">Stopped at policy gate</div>
                </div>
              </div>
              <div className="mini-gate">
                <Icon name="lock" size={9} /> Gated tool · approval required
              </div>

              <div className="mini-watcher">
                <div className="mini-watcher-top">
                  <span className="mini-watcher-name">exampleco.example/careers</span>
                  <MiniStatus tone="muted">Stored</MiniStatus>
                </div>
                <div className="mini-watcher-meta">Every 120 min · scheduler not connected</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mini-panel mini-activity">
        <div className="mini-panel-head">
          <span className="mini-panel-title">Recent activity</span>
          <span className="mini-panel-link">Audit trail</span>
        </div>
        <div className="mini-panel-body">
          <div className="mini-activity-row">
            <span className="mini-activity-time">09:41</span>
            <span className="mini-activity-copy">
              Approval prepared · Senior Software Engineer, Growth
            </span>
            <MiniStatus tone="warning">Awaiting you</MiniStatus>
          </div>
          <div className="mini-activity-row">
            <span className="mini-activity-time">09:38</span>
            <span className="mini-activity-copy">Source snapshot re-read · hash unchanged</span>
            <MiniStatus tone="muted">Recorded</MiniStatus>
          </div>
          <div className="mini-activity-row">
            <span className="mini-activity-time">09:36</span>
            <span className="mini-activity-copy">Agent run stopped at submit_application</span>
            <MiniStatus tone="muted">Dev runtime</MiniStatus>
          </div>
        </div>
      </div>
    </>
  );
}

function DiscoverScene() {
  return (
    <>
      <div className="preview-head">
        <div>
          <div className="preview-head-title">Discover</div>
          <div className="preview-head-sub">
            5 known roles · 2 duplicates collapsed · manual intake
          </div>
        </div>
        <div className="preview-head-actions">
          <span className="mini-btn">Saved views</span>
          <span className="mini-btn mini-btn-dark">
            <Icon name="plus" size={10} /> Add role
          </span>
        </div>
      </div>

      <div className="preview-toolbar">
        <span className="mini-filter" data-active="true">
          All
        </span>
        <span className="mini-filter">Remote</span>
        <span className="mini-filter">Needs review</span>
        <span className="mini-search">
          <Icon name="search" size={9} /> Search roles, companies, evidence
        </span>
      </div>

      <div className="preview-cols">
        <div className="mini-panel">
          <div className="mini-panel-head">
            <span className="mini-panel-title">Role intake</span>
            <span className="mini-panel-link">Newest first</span>
          </div>
          <div className="mini-panel-body" style={{ paddingTop: 4 }}>
            <div className="mini-job">
              <Avatar initials="EC" />
              <div className="mini-job-copy">
                <div className="mini-job-title">Senior Software Engineer, Growth</div>
                <div className="mini-job-meta">ExampleCorp · Remote, US · $165,000/yr</div>
                <div className="mini-job-why">
                  <Icon name="sparkles" size={8} />3 checks passed · 8 of 9 requirements
                </div>
              </div>
              <div className="mini-job-side">
                <MiniStatus tone="success">Verified</MiniStatus>
                <span className="mini-row-date">18 Oct</span>
              </div>
            </div>

            <div className="mini-job">
              <Avatar initials="GW" tone="lime" />
              <div className="mini-job-copy">
                <div className="mini-job-title">Platform Engineer II</div>
                <div className="mini-job-meta">GraphiteWorks · Austin, TX · $150,000/yr</div>
                <div className="mini-job-why">
                  <Icon name="sparkles" size={8} />
                  Comp matches · location needs review
                </div>
              </div>
              <div className="mini-job-side">
                <MiniStatus tone="warning">Possible</MiniStatus>
                <span className="mini-row-date">18 Oct</span>
              </div>
            </div>

            <div className="mini-job">
              <Avatar initials="TV" tone="teal" />
              <div className="mini-job-copy">
                <div className="mini-job-title">Full-stack Engineer, Product</div>
                <div className="mini-job-meta">TerraVine · Remote · compensation not listed</div>
                <div className="mini-job-why">
                  <Icon name="sparkles" size={8} />
                  Unknown comp stays unknown
                </div>
              </div>
              <div className="mini-job-side">
                <MiniStatus tone="muted">Unknown</MiniStatus>
                <span className="mini-row-date">19 Oct</span>
              </div>
            </div>

            <div className="mini-job">
              <Avatar initials="DR" tone="warm" />
              <div className="mini-job-copy">
                <div className="mini-job-title">Staff Platform Engineer</div>
                <div className="mini-job-meta">DefenseRay · Denver, CO · on-site</div>
                <div className="mini-job-why">
                  <Icon name="shield" size={8} />
                  Excluded by defense-contract hard filter
                </div>
              </div>
              <div className="mini-job-side">
                <MiniStatus tone="danger">Excluded</MiniStatus>
                <span className="mini-row-date">19 Oct</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mini-panel">
            <div className="mini-panel-head">
              <span className="mini-panel-title">Eligibility</span>
              <MiniStatus tone="signal">Verified</MiniStatus>
            </div>
            <div className="mini-panel-body">
              <div className="mini-check">
                <Icon name="check" size={9} />
                <span>
                  Work authorization
                  <small>US citizen · verified in profile</small>
                </span>
              </div>
              <div className="mini-check">
                <Icon name="check" size={9} />
                <span>
                  Compensation
                  <small>$165k vs $140k minimum</small>
                </span>
              </div>
              <div className="mini-check">
                <Icon name="check" size={9} />
                <span>
                  Role family
                  <small>Software Engineer · match</small>
                </span>
              </div>
              <div className="mini-check" data-tone="warn">
                <Icon name="clock" size={9} />
                <span>
                  Posting freshness
                  <small>Captured 18 Oct · re-check before send</small>
                </span>
              </div>
            </div>
          </div>

          <div className="mini-panel" style={{ marginTop: 8 }}>
            <div className="mini-panel-head">
              <span className="mini-panel-title">Watcher</span>
              <MiniStatus tone="muted">Stored</MiniStatus>
            </div>
            <div className="mini-panel-body">
              <div className="mini-watcher" style={{ marginTop: 0, borderTop: 0, paddingTop: 0 }}>
                <div className="mini-watcher-name">exampleco.example/careers</div>
                <div className="mini-watcher-meta">Every 120 min · no scheduler connected</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mini-panel mini-reads">
        <div className="mini-panel-head">
          <span className="mini-panel-title">Recent source reads</span>
          <span className="mini-panel-link">Snapshots stored</span>
        </div>
        <div className="mini-panel-body">
          <div className="mini-activity-row">
            <span className="mini-activity-time">09:12</span>
            <span className="mini-activity-copy">exampleco.example/careers</span>
            <MiniStatus tone="muted">Read</MiniStatus>
          </div>
          <div className="mini-activity-row">
            <span className="mini-activity-time">09:14</span>
            <span className="mini-activity-copy">graphiteworks.example/jobs</span>
            <MiniStatus tone="muted">Read</MiniStatus>
          </div>
        </div>
      </div>
    </>
  );
}

function QualifyScene() {
  return (
    <>
      <div className="preview-head">
        <div>
          <div className="preview-head-title">Senior Software Engineer, Growth</div>
          <div className="preview-head-sub">ExampleCorp · Remote, US · captured 18 Oct 2026</div>
        </div>
        <div className="preview-head-actions">
          <MiniStatus tone="success">Verified eligible</MiniStatus>
          <span className="mini-btn mini-btn-dark">
            Start application <Icon name="arrowUpRight" size={9} />
          </span>
        </div>
      </div>

      <div className="preview-cols">
        <div className="mini-panel">
          <div className="mini-panel-head">
            <span className="mini-panel-title">Fit evidence</span>
            <span className="mini-panel-link">8 / 9 met</span>
          </div>
          <div className="mini-panel-body">
            <div className="mini-detail-meta">
              A factual comparison. Missing evidence never becomes a silent pass.
            </div>
            <div className="mini-section-label">Verified</div>
            <div className="mini-check">
              <Icon name="check" size={9} />
              <span>
                TypeScript & React
                <small>Expert · listed in profile and posting</small>
              </span>
            </div>
            <div className="mini-check">
              <Icon name="check" size={9} />
              <span>
                Seniority
                <small>Senior · profile targets senior and staff</small>
              </span>
            </div>
            <div className="mini-check">
              <Icon name="check" size={9} />
              <span>
                Work authorization
                <small>No sponsorship required</small>
              </span>
            </div>
            <div className="mini-check" data-tone="warn">
              <Icon name="clock" size={9} />
              <span>
                Posting freshness
                <small>Re-read the source snapshot before approval</small>
              </span>
            </div>

            <div className="mini-section-label">Hard filters</div>
            <div className="mini-check">
              <Icon name="shield" size={9} />
              <span>
                Defense contract work excluded
                <small>Profile exclusion applied before scoring</small>
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="mini-panel">
            <div className="mini-panel-head">
              <span className="mini-panel-title">Source snapshot</span>
              <MiniStatus tone="muted">Manual</MiniStatus>
            </div>
            <div className="mini-panel-body">
              <div className="mini-evidence">
                <div className="mini-evidence-name">exampleco.example/careers</div>
                <div className="mini-evidence-meta">captured 18 Oct 2026 · hash 8b1f…9d2a</div>
              </div>
              <div className="mini-evidence">
                <div className="mini-evidence-name">Description hash</div>
                <div className="mini-evidence-meta">e3a9…41c0 · changes trigger review</div>
              </div>
            </div>
          </div>

          <div className="mini-panel" style={{ marginTop: 8 }}>
            <div className="mini-panel-head">
              <span className="mini-panel-title">Gate status</span>
              <MiniStatus tone="warning">1 pending</MiniStatus>
            </div>
            <div className="mini-panel-body">
              <div className="mini-gate" style={{ marginTop: 0 }}>
                <Icon name="lock" size={9} /> submit_application is gated. Approval comes before
                action.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ApproveScene() {
  return (
    <>
      <div className="preview-head">
        <div>
          <div className="preview-head-title">Approval</div>
          <div className="preview-head-sub">
            1 exact payload · bound to a hash · consumable once
          </div>
        </div>
        <div className="preview-head-actions">
          <MiniStatus tone="warning">Awaiting you</MiniStatus>
          <span className="mini-btn">Policy trace</span>
        </div>
      </div>

      <div className="preview-cols">
        <div className="mini-approval">
          <div className="mini-approval-top">
            <span className="mini-approval-label">Single-use approval</span>
            <MiniStatus tone="warning">Submit application</MiniStatus>
          </div>
          <h4>Senior Software Engineer, Growth</h4>
          <div className="mini-approval-destination">jobs.exampleco.example/listings/1001</div>

          <div className="mini-approval-grid">
            <div className="mini-field">
              <div className="mini-field-label">Destination</div>
              <div className="mini-field-value">ExampleCorp careers</div>
            </div>
            <div className="mini-field">
              <div className="mini-field-label">Attachment</div>
              <div className="mini-field-value">demo-master-resume.pdf</div>
            </div>
            <div className="mini-field">
              <div className="mini-field-label">Profile fields</div>
              <div className="mini-field-value">Name · email · US work auth</div>
            </div>
            <div className="mini-field">
              <div className="mini-field-label">Unknown fields</div>
              <div className="mini-field-value">None in this preview</div>
            </div>
            <div className="mini-field">
              <div className="mini-field-label">Compensation</div>
              <div className="mini-field-value">$165,000/yr · listed</div>
            </div>
            <div className="mini-field">
              <div className="mini-field-label">Location</div>
              <div className="mini-field-value">Remote, US</div>
            </div>
          </div>

          <div className="mini-approval-foot">
            <span className="mini-hash">sha256 9f3a…c21e</span>
            <div className="mini-approval-actions">
              <span className="mini-btn">Reject</span>
              <span className="mini-btn mini-btn-dark">Approve exact payload</span>
            </div>
          </div>
        </div>

        <div>
          <div className="mini-panel">
            <div className="mini-panel-head">
              <span className="mini-panel-title">What happens next</span>
            </div>
            <div className="mini-panel-body">
              <div className="mini-timeline">
                <div className="mini-timeline-item" data-state="pending">
                  <span className="mini-timeline-dot" />
                  <div className="mini-timeline-label">Approval locked</div>
                  <div className="mini-timeline-meta">hash becomes immutable</div>
                </div>
                <div className="mini-timeline-item" data-state="empty">
                  <span className="mini-timeline-dot" />
                  <div className="mini-timeline-label">Submission attempted</div>
                  <div className="mini-timeline-meta">not run until approved</div>
                </div>
                <div className="mini-timeline-item" data-state="empty">
                  <span className="mini-timeline-dot" />
                  <div className="mini-timeline-label">Confirmation captured</div>
                  <div className="mini-timeline-meta">confirmation_ref required</div>
                </div>
              </div>
              <div className="mini-gate" style={{ marginTop: 9 }}>
                <Icon name="shield" size={9} /> No auto-submit. You decide.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="approval-checks">
        <span>
          <Icon name="check" size={9} /> Destination allowlisted
        </span>
        <span>
          <Icon name="check" size={9} /> Payload unchanged since review
        </span>
        <span>
          <Icon name="clock" size={9} /> Approval expires in 23h
        </span>
      </div>

      <div className="approval-evidence">
        <div>
          <span className="mini-field-label">Evidence bundle</span>
          <strong>3 records attached</strong>
        </div>
        <div>
          <span className="mini-field-label">Resume</span>
          <strong>demo-master-resume.pdf</strong>
        </div>
        <div>
          <span className="mini-field-label">Source snapshot</span>
          <strong>8b1f…9d2a · re-read 18 Oct</strong>
        </div>
      </div>

      <div className="approval-note">
        Add a note to the audit trail <span>optional · stored with the approval</span>
      </div>
    </>
  );
}

function TrackScene() {
  return (
    <>
      <div className="preview-head">
        <div>
          <div className="preview-head-title">Application record</div>
          <div className="preview-head-sub">Senior Software Engineer, Growth · ExampleCorp</div>
        </div>
        <div className="preview-head-actions">
          <MiniStatus tone="warning">Ready for review</MiniStatus>
          <span className="mini-btn">Export record</span>
        </div>
      </div>

      <div className="preview-cols">
        <div className="mini-panel">
          <div className="mini-panel-head">
            <span className="mini-panel-title">Timeline</span>
            <span className="mini-panel-link">All events</span>
          </div>
          <div className="mini-panel-body">
            <div className="mini-timeline">
              <div className="mini-timeline-item" data-state="done">
                <span className="mini-timeline-dot" />
                <div className="mini-timeline-label">Profile read</div>
                <div className="mini-timeline-meta">
                  18 Oct 2026 · 09:10 · 4 verified fields · no unknowns promoted
                </div>
              </div>
              <div className="mini-timeline-item" data-state="done">
                <span className="mini-timeline-dot" />
                <div className="mini-timeline-label">Discovered</div>
                <div className="mini-timeline-meta">
                  18 Oct 2026 · 09:12 · manual intake · source snapshot attached
                </div>
              </div>
              <div className="mini-timeline-item" data-state="done">
                <span className="mini-timeline-dot" />
                <div className="mini-timeline-label">Verified</div>
                <div className="mini-timeline-meta">
                  18 Oct 2026 · 09:12 · eligibility rule set v1
                </div>
              </div>
              <div className="mini-timeline-item" data-state="done">
                <span className="mini-timeline-dot" />
                <div className="mini-timeline-label">Qualified</div>
                <div className="mini-timeline-meta">
                  19 Oct 2026 · 16:40 · 8 of 9 requirements met
                </div>
              </div>
              <div className="mini-timeline-item" data-state="done">
                <span className="mini-timeline-dot" />
                <div className="mini-timeline-label">Source re-read</div>
                <div className="mini-timeline-meta">
                  20 Oct 2026 · 09:30 · description hash unchanged
                </div>
              </div>
              <div className="mini-timeline-item" data-state="pending">
                <span className="mini-timeline-dot" />
                <div className="mini-timeline-label">Ready for review</div>
                <div className="mini-timeline-meta">21 Oct 2026 · 10:05 · 1 approval pending</div>
              </div>
              <div className="mini-timeline-item" data-state="pending">
                <span className="mini-timeline-dot" />
                <div className="mini-timeline-label">Approval prepared</div>
                <div className="mini-timeline-meta">
                  21 Oct 2026 · 10:06 · single-use · sha256 9f3a…c21e
                </div>
              </div>
              <div className="mini-timeline-item" data-state="empty">
                <span className="mini-timeline-dot" />
                <div className="mini-timeline-label">No submission recorded</div>
                <div className="mini-timeline-meta">confirmation_ref is required for SUBMITTED</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mini-panel">
            <div className="mini-panel-head">
              <span className="mini-panel-title">Evidence</span>
              <MiniStatus tone="success">4 attached</MiniStatus>
            </div>
            <div className="mini-panel-body">
              <div className="mini-evidence">
                <div className="mini-evidence-name">Source snapshot</div>
                <div className="mini-evidence-meta">8b1f…9d2a · 18 Oct</div>
              </div>
              <div className="mini-evidence">
                <div className="mini-evidence-name">Eligibility reasons</div>
                <div className="mini-evidence-meta">3 passed · 1 review</div>
              </div>
              <div className="mini-evidence">
                <div className="mini-evidence-name">Resume record</div>
                <div className="mini-evidence-meta">demo-master-resume.pdf</div>
              </div>
            </div>
          </div>

          <div className="mini-panel" style={{ marginTop: 8 }}>
            <div className="mini-panel-head">
              <span className="mini-panel-title">Confirmation</span>
            </div>
            <div className="mini-panel-body">
              <div className="mini-empty">No confirmation_ref yet. Nothing claims success.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function ProductWindow({ scene }: { scene: Scene }) {
  return (
    <div className="preview preview-desktop">
      <div className="preview-chrome">
        <span className="preview-dots" aria-hidden>
          <span />
          <span />
          <span />
        </span>
        <span className="preview-url">
          <Icon name="lock" size={8} />
          app.pursuit.local{SCENE_PATH[scene]}
        </span>
        <span className="preview-chrome-right">
          <span className="preview-chrome-chip">Sample workspace</span>
          <span className="preview-live">
            <span className="live-dot" />
            Proposal-only
          </span>
        </span>
      </div>
      <div className="preview-body">
        <Rail scene={scene} />
        <div className="preview-main">
          {scene === 'overview' && <OverviewScene />}
          {scene === 'discover' && <DiscoverScene />}
          {scene === 'qualify' && <QualifyScene />}
          {scene === 'approve' && <ApproveScene />}
          {scene === 'track' && <TrackScene />}
        </div>
      </div>
    </div>
  );
}

function PhoneNav({ scene }: { scene: Scene }) {
  const active = scene === 'discover' || scene === 'qualify' ? 'jobs' : scene;
  const items: Array<[IconName, string, Scene]> = [
    ['home', 'Home', 'overview'],
    ['briefcase', 'Jobs', 'discover'],
    ['sparkles', 'Agent', 'approve'],
    ['send', 'Outreach', 'track'],
    ['folder', 'Vault', 'track'],
  ];
  return (
    <div className="phone-nav">
      {items.map(([icon, label, target]) => (
        <span
          key={label}
          className="phone-nav-item"
          data-active={active === target && label !== 'Outreach' && label !== 'Vault'}
        >
          <Icon name={icon} size={14} />
          {label}
        </span>
      ))}
    </div>
  );
}

function PhoneContent({ scene }: { scene: Scene }) {
  if (scene === 'overview') {
    return (
      <>
        <div className="phone-app-head">
          <Wordmark />
          <span className="phone-avatar">DO</span>
        </div>
        <div className="phone-title">Good evening, Demo.</div>
        <div className="phone-subtitle">One thing needs you.</div>

        <div className="phone-next">
          <div className="phone-next-label">
            <span>Next move</span>
            <span className="phone-next-pill">1 approval</span>
          </div>
          <h4>Review the exact payload.</h4>
          <p>Senior Software Engineer, Growth · ExampleCorp</p>
          <span className="phone-next-button">
            Open approval <Icon name="arrowUpRight" size={8} />
          </span>
        </div>

        <div className="phone-stats">
          <div className="phone-stat">
            <div className="phone-stat-label">Open roles</div>
            <div className="phone-stat-value">5</div>
          </div>
          <div className="phone-stat">
            <div className="phone-stat-label">Applications</div>
            <div className="phone-stat-value">3</div>
          </div>
          <div className="phone-stat">
            <div className="phone-stat-label">Awaiting</div>
            <div className="phone-stat-value">1</div>
          </div>
        </div>

        <div className="phone-section-head">
          <span className="phone-section-title">Recent</span>
          <span className="phone-section-link">View all</span>
        </div>
        <div className="phone-row">
          <Avatar initials="EC" />
          <div className="phone-row-copy">
            <div className="phone-row-title">Senior Software Engineer</div>
            <div className="phone-row-meta">ExampleCorp · ready for review</div>
          </div>
          <MiniStatus tone="warning">Review</MiniStatus>
        </div>
        <div className="phone-row">
          <Avatar initials="GW" tone="lime" />
          <div className="phone-row-copy">
            <div className="phone-row-title">Platform Engineer II</div>
            <div className="phone-row-meta">GraphiteWorks · qualified</div>
          </div>
          <MiniStatus tone="success">Fit</MiniStatus>
        </div>
      </>
    );
  }

  if (scene === 'discover') {
    return (
      <>
        <div className="phone-app-head">
          <Wordmark />
          <span className="phone-avatar">DO</span>
        </div>
        <div className="phone-title">Discover</div>
        <div className="phone-subtitle">5 roles · 2 duplicates collapsed</div>
        <div className="mini-search" style={{ marginTop: 10, height: 28 }}>
          <Icon name="search" size={10} /> Search roles
        </div>
        <div style={{ marginTop: 8 }}>
          <div className="phone-job">
            <div className="phone-job-top">
              <div>
                <div className="phone-job-title">Senior Software Engineer</div>
                <div className="phone-job-meta">ExampleCorp · Remote, US</div>
              </div>
              <MiniStatus tone="success">Verified</MiniStatus>
            </div>
            <div className="phone-job-why">3 checks passed · 8 of 9 met</div>
          </div>
          <div className="phone-job">
            <div className="phone-job-top">
              <div>
                <div className="phone-job-title">Platform Engineer II</div>
                <div className="phone-job-meta">GraphiteWorks · Austin, TX</div>
              </div>
              <MiniStatus tone="warning">Possible</MiniStatus>
            </div>
            <div className="phone-job-why">Comp matches · location review</div>
          </div>
          <div className="phone-job">
            <div className="phone-job-top">
              <div>
                <div className="phone-job-title">Full-stack Engineer</div>
                <div className="phone-job-meta">TerraVine · Remote</div>
              </div>
              <MiniStatus tone="muted">Unknown</MiniStatus>
            </div>
            <div className="phone-job-why">Compensation not listed</div>
          </div>
        </div>
      </>
    );
  }

  if (scene === 'qualify') {
    return (
      <>
        <div className="phone-app-head">
          <Wordmark />
          <span className="phone-avatar">DO</span>
        </div>
        <div className="phone-title" style={{ fontSize: 17 }}>
          Senior Software Engineer, Growth
        </div>
        <div className="phone-subtitle">ExampleCorp · Remote, US</div>
        <div style={{ marginTop: 9 }}>
          <MiniStatus tone="success">Verified eligible</MiniStatus>
        </div>
        <div className="phone-section-head">
          <span className="phone-section-title">Fit evidence</span>
          <span className="phone-section-link">8 / 9 met</span>
        </div>
        <div className="mini-check">
          <Icon name="check" size={9} /> TypeScript & React
        </div>
        <div className="mini-check">
          <Icon name="check" size={9} /> Seniority match
        </div>
        <div className="mini-check">
          <Icon name="check" size={9} /> Work authorization
        </div>
        <div className="mini-check" data-tone="warn">
          <Icon name="clock" size={9} /> Re-read source snapshot
        </div>
        <div className="mini-gate" style={{ marginTop: 10 }}>
          <Icon name="lock" size={9} /> Start application requires a profile record.
        </div>
        <span className="mini-btn mini-btn-dark" style={{ width: '100%', marginTop: 9 }}>
          Start application <Icon name="arrowUpRight" size={9} />
        </span>
      </>
    );
  }

  if (scene === 'approve') {
    return (
      <>
        <div className="phone-app-head">
          <Wordmark />
          <span className="phone-avatar">DO</span>
        </div>
        <div className="phone-title">Approval</div>
        <div className="phone-subtitle">1 exact payload · single use</div>
        <div className="phone-approval" style={{ marginTop: 10 }}>
          <div className="mini-approval">
            <div className="mini-approval-top">
              <span className="mini-approval-label">Single-use</span>
              <MiniStatus tone="warning">Awaiting you</MiniStatus>
            </div>
            <h4>Submit application</h4>
            <div className="mini-approval-destination">jobs.exampleco.example/listings/1001</div>
            <div className="mini-approval-grid">
              <div className="mini-field">
                <div className="mini-field-label">Attachment</div>
                <div className="mini-field-value">demo-master-resume.pdf</div>
              </div>
              <div className="mini-field">
                <div className="mini-field-label">Fields</div>
                <div className="mini-field-value">Name · email · work auth</div>
              </div>
            </div>
            <div className="mini-hash" style={{ marginTop: 8 }}>
              sha256 9f3a…c21e
            </div>
            <div className="mini-approval-actions">
              <span className="mini-btn">Reject</span>
              <span className="mini-btn mini-btn-dark">Approve exact payload</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="phone-app-head">
        <Wordmark />
        <span className="phone-avatar">DO</span>
      </div>
      <div className="phone-title" style={{ fontSize: 18 }}>
        Application
      </div>
      <div className="phone-subtitle">Senior Software Engineer, Growth</div>
      <div style={{ marginTop: 9 }}>
        <MiniStatus tone="warning">Ready for review</MiniStatus>
      </div>
      <div className="phone-timeline">
        <div className="mini-timeline">
          <div className="mini-timeline-item" data-state="done">
            <span className="mini-timeline-dot" />
            <div className="mini-timeline-label">Discovered</div>
            <div className="mini-timeline-meta">18 Oct · source snapshot</div>
          </div>
          <div className="mini-timeline-item" data-state="done">
            <span className="mini-timeline-dot" />
            <div className="mini-timeline-label">Verified</div>
            <div className="mini-timeline-meta">18 Oct · eligibility recorded</div>
          </div>
          <div className="mini-timeline-item" data-state="done">
            <span className="mini-timeline-dot" />
            <div className="mini-timeline-label">Qualified</div>
            <div className="mini-timeline-meta">19 Oct · 8 of 9 met</div>
          </div>
          <div className="mini-timeline-item" data-state="pending">
            <span className="mini-timeline-dot" />
            <div className="mini-timeline-label">Ready for review</div>
            <div className="mini-timeline-meta">21 Oct · approval pending</div>
          </div>
          <div className="mini-timeline-item" data-state="empty">
            <span className="mini-timeline-dot" />
            <div className="mini-timeline-label">No submission recorded</div>
            <div className="mini-timeline-meta">confirmation_ref required</div>
          </div>
        </div>
        <div className="mini-empty" style={{ marginTop: 9 }}>
          Nothing claims success.
        </div>
      </div>
    </>
  );
}

export function PhoneMock({ scene = 'overview' }: { scene?: Scene }) {
  return (
    <div className="phone">
      <div className="phone-screen">
        <div className="phone-notch" />
        <div className="phone-status">
          <span>9:41</span>
          <span className="phone-status-icons">
            <span />
            <span />
            <span />
          </span>
        </div>
        <div className="phone-content">
          <PhoneContent scene={scene} />
        </div>
        <PhoneNav scene={scene} />
      </div>
    </div>
  );
}

export function MobileProductWindow({ scene }: { scene: Scene }) {
  return (
    <div className="preview-mobile">
      <div className="mobile-preview-inner">
        <PhoneMock scene={scene} />
        <div className="mobile-preview-caption">Interactive preview · sample workspace</div>
      </div>
    </div>
  );
}
