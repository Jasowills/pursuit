# Pursuit UI kit and design tokens

## Foundations

Primary light theme, white canvas, near-black controls, neutral grayscale. Use Geist Sans and Geist Mono with legal webfont loading or system fallback. All tokens are proposed Pursuit values, not extracted Jobmate measurements.

```css
:root {
  --background: #ffffff;
  --foreground: #111111;
  --primary: #111111;
  --primary-foreground: #ffffff;
  --surface: #fafafa;
  --surface-raised: #ffffff;
  --muted: #71717a;
  --muted-foreground: #52525b;
  --border: #e4e4e7;
  --hover: #f4f4f5;
  --focus: #52525b;
  --success: #15803d;
  --warning: #a16207;
  --danger: #b91c1c;
  --radius-sm: 8px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --shadow-panel: 0 18px 60px rgba(17, 17, 17, 0.08);
  --font-sans: 'Geist', Inter, system-ui, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;
}
```

Spacing scale: 4,8,12,16,20,24,32,40,48,64,80,96px. Desktop container 1200px, side gutters 32px; tablet 24px; mobile 20px. Typography: display 68/1.05/-0.045em 700; h1 interior 40/1.15 650; h2 32/1.2 650; h3 24/1.25 600; body 16/1.6 400; small 14/1.5; caption 12/1.4. Mobile hero 42/1.1. Buttons min 44px touch height, 48px primary hero; focus outline 2px with 2px offset. Dark mode deferred, but token architecture supports it.

## Component specification

Implement accessible shadcn/ui and Radix-based primitives with customized variants. Each must expose loading, disabled, hover, focus, validation and responsive states.

- Button: primary black/white, secondary light gray, outline, ghost, destructive, icon; sizes sm(36), md(44), lg(48); loading spinner and aria-busy.
- Input/Textarea: 44px height baseline, label, hint, error text, focus ring, optional leading icon, clear button.
- Combobox/Select/Date picker: keyboard accessible, async search and empty/error states.
- Checkbox/Radio/Switch: 44px minimum interactive hit target on mobile.
- Badge: neutral by default; semantic success/warning/danger only for real statuses; never rely on color alone.
- Card: 1px border, white surface, 14px radius, 16-24px padding, no heavy shadow.
- Dialog/Drawer/BottomSheet: focus trap, Escape support, return focus, explicit confirm for irreversible actions.
- DataTable: sorting, pagination, filter chips, empty/loading/error states, accessible headers; mobile becomes cards.
- Tabs, Tooltip, Popover, Toast, Skeleton, Progress, Breadcrumb, Command palette, Stepper.

## Domain-specific components

- `JobCard`: company, role, location, remote restrictions, source link, eligibility state, match score explanation, saved/ignored actions.
- `ApplicationTimeline`: timestamps, state transitions, evidence and errors; clear 'not yet submitted' wording.
- `ApprovalCard`: exact destination, intended action, answers, attachments, consent expiry, Approve/Reject/Edit.
- `AgentRunTimeline`: step states, tool names, durations, retry count, budget use, artifact links.
- `WatcherCard`: URL, interval, last check, next check, new roles, paused/error state.
- `ResumeVersionCard`: file name, job, created date, template, PDF/DOCX preview/download, diff, submitted flag.
- `OutreachComposer`: verified contact, source link, message body, tone controls, send preview and approval.
- `ThreadSummary`: source messages, detected intent, confidence, next action, user corrections.
- `NotificationItem`: actionable deep link, read/unread, urgency, source event.

## Mobile patterns

Bottom navigation: Home, Jobs, Agent, Outreach, Vault. Watchers under Agent; settings from profile. Native safe areas, haptic feedback sparingly, pull to refresh, virtualized lists, secure local token storage, accessible dynamic type. Push notification tap opens precise record.

## QA / acceptance

Storybook stories for each state; visual regression at 390, 768, 1440 widths; keyboard-only smoke tests; axe checks; WCAG 2.2 AA color contrast; no horizontal overflow; no fake metrics in real production screens; responsive screenshot baseline approvals.
