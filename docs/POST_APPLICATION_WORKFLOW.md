# Interviews, tasks and company leads

Confirmed requirement, 2026-10-22: track interviews from **both Gmail and Google Calendar**, manage the work that follows an application, and find relevant people at companies the user applied to. This document specifies implementation work. It does not declare these integrations shipped.

## The user workflow

An applied role remains the organizing record. It contains the exact submitted packet and receipt, employer communications, upcoming interviews, preparation/follow-up tasks, and sourced contacts. “Applied” is not the end of the pipeline.

An interview invitation becomes a proposed interview record. A clear, unique match to an application may be tracked automatically; uncertain employer, role, date or time zone goes to a review inbox. The source message/event stays linked. Tracking never sends an RSVP, modifies an employer calendar event, emails a contact or changes an application outcome without the relevant authority.

The desktop should expose **Interviews & tasks**, while each application has its own interview timeline and contacts. The assistant can answer “What do I need to prepare this week?” from stored records, rather than rereading the inbox with a model on every question.

## Permissions and source boundaries

- Gmail ingestion uses a separately granted read scope (`gmail.readonly`), distinct from existing `gmail.send` outreach. Reusing send authorization does not authorize inbox access.
- Calendar ingestion uses separately granted event read access (`calendar.events.readonly`). If the UI lists available calendars, request the separate `calendar.calendarlist.readonly` scope for that selection. Start with calendars the user selects; do not assume every calendar event belongs to a job search.
- Show connected account, selected calendars, last successful sync, current error and disconnect controls. Retain the prior sync cursor on partial failure. Expired authorization stops that source and asks for reconnection.
- Credentials stay in the native OS credential store, or encrypted in an explicitly authorized worker. The model receives only relevant, minimized content when interpretation is needed.
- The existing desktop has no native Gmail/calendar connector or durable source worker. The retained API has send-only Gmail authorization. Both need explicit integration work; a mockup is not that integration.

## Automatic interview tracking

Normalize source records into source ID, thread/event UID, original text link, organizer, participants, employer, role, time, original time zone, location/meeting URL, cancellation state and source revision. Persist provenance, extraction method and any ambiguity.

Use deterministic parsing and exact identifiers first. Match an existing application by employer domain plus role/thread linkage, never just a common company name. For genuinely ambiguous text, a bounded model call may suggest fields, but an unknown date, multiple plausible applications, spoofed sender or contradictory event must remain reviewable. Message text and event descriptions are untrusted data, not agent instructions.

Deduplicate Gmail's invitation and the corresponding Calendar event into one interview using event UID/ICS UID or a reviewed association. Keep both source references. Handle reschedules, cancellations, recurring-event exceptions, DST and attendee-declined states without silently creating extra interviews. A deleted event is not evidence that the job rejected the user.

Track stages such as recruiter screen, technical interview, portfolio review and final interview as editable labels. Never infer an offer/rejection solely from a calendar title. Record user corrections separately from imported facts so a later sync cannot overwrite them.

## Task management

Tasks belong to an application or interview, with title, due date/time zone, state, origin, source reference and user edits. Provide add, edit, complete, reopen and dismiss actions. Suggested tasks can include researching the team, preparing a project example, recording a requested video and following up after an interview.

Suggestions are distinct from commitments. A reschedule updates untouched system-generated preparation deadlines; it must not overwrite a user's chosen deadline. Cancelled interviews retire untouched generated reminders, retain history and flag manually edited tasks. Completing a task does not imply an email was sent or a submission succeeded.

The UI must show overdue, due soon and blocked tasks with explicit text as well as semantic color. Notifications should point to the exact task/interview and respect quiet hours, deduplication and the chosen desktop/worker execution mode.

## Company contact leads

Start from the applied company's verified domain and role/team. Find relevant recruiting, hiring-management and team contacts using permitted public company/team/careers sources or a user-authorized search provider. Distinguish the hiring manager from someone who merely works there.

Every candidate lead includes the company/application link, public profile/source URL, observed role, reason for relevance, discovery timestamp and confidence. Never invent an email address or equate a guessed domain pattern with a verified address. Separate identity evidence from permission to contact. Honor exclusions and do-not-contact choices.

The first action is **Review lead**, followed by a draft based on the application and source. Sending remains an exact-recipient/exact-message approval, including when autopilot applications are enabled. Finding a lead must not automatically send outreach or scrape authenticated private profiles.

## Build sequence and acceptance gates

1. Local interview/task/lead records, migrations and application-detail screens; save/restart and permission tests.
2. Native Gmail read connector and Calendar read connector; separate grants, revocation, bounded sync and cursor recovery.
3. Unified invitation importer and review inbox, with cross-source deduplication, reschedule/cancellation and time-zone fixtures.
4. Source-backed lead research adapter, lead review and approved outreach handoff.
5. Optional worker execution and companion notifications, using the same persisted events and consent policy.

Required tests: old-workspace migration; tenant/device ownership; revoked credentials; multiple calendars; duplicate mail/calendar invitation; edited/rescheduled/cancelled invitation; DST and missing time zone; forwarded/spoofed sender; prompt injection in mail/event/source page; multiple applications at one company; lead-company mismatch; missing/guessed email; failed sync retry without duplicates; task edit preservation; no automatic RSVP or email; restart/offline recovery; notifications delivered once. Live verification requires the user's configured Google test account and separate grants. No live connection is configured yet.

## Source references

Scope and API semantics must be verified against Google's first-party documentation during connector implementation: [Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes), [Gmail synchronization](https://developers.google.com/workspace/gmail/api/guides/sync), [Calendar authorization](https://developers.google.com/workspace/calendar/api/auth), [Calendar incremental synchronization](https://developers.google.com/workspace/calendar/api/guides/sync).
