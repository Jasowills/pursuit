# Pursuit — Logical data model

All tenant-scoped tables have `tenant_id`, `created_at`, `updated_at`, and audit actor. Use UUIDv7 or UUID; exact choice open. Never use emails as primary keys. Index all foreign keys and frequently filtered status/time fields.

## Core tables

- `tenants(id,name,plan,status)`; `users(id,email,display_name)`; `memberships(tenant_id,user_id,role)`; `sessions` and `devices`.
- `career_profiles(id,tenant_id,user_id,location,role_preferences,work_authorization,compensation_preferences,verified_at)`; `experiences`, `education`, `skills`, `projects`, `evidence_claims(id,source,claim,verification_state)`.
- `writing_samples(id,channel,approved,text,source)`; `tone_rules(id,channel,rule,priority)`; `writing_feedback`.
- `companies(id,canonical_domain,name,aliases)`; `company_preferences(tenant_id,company_id,excluded,reason)`.
- `job_sources(id,kind,base_url,terms_status)`; `jobs(id,company_id,source_id,external_id,canonical_url,title,location,description_hash,posted_at,last_seen_at,status)`; `job_snapshots(id,job_id,description,metadata,observed_at)`.
- `job_matches(id,tenant_id,job_id,eligibility,eligibility_evidence,fit_score,fit_rationale,hard_failures,model_version)`.
- `resume_masters(id,tenant_id,owner_id,original_object_key,parsed_facts_version)`; `resume_versions(id,tenant_id,master_id,job_id,template_version,content_hash,docx_key,pdf_key,diff_json,status,approved_at)`.
- `applications(id,tenant_id,job_id,resume_version_id,status,submitted_at,confirmation_ref,source_url)`; `application_answers(id,application_id,field_key,value,provenance,verification)`; `application_events(id,application_id,from_status,to_status,actor,reason,evidence_key)`.
- `contacts(id,tenant_id,company_id,name,role,email,profile_url,source_url,confidence,do_not_contact)`; `outreach_threads(id,tenant_id,contact_id,company_id,job_id,channel,status)`; `outreach_messages(id,thread_id,direction,body_hash,body_encrypted,provider_message_id,sent_at)`.
- `watchers(id,tenant_id,source_url,kind,frequency,filters,enabled,last_checked_at,next_check_at,error_streak)`; `watcher_events(id,watcher_id,job_id,event_type,detected_at,dedupe_key)`.
- `agent_runs(id,tenant_id,initiator,goal,status,model_provider,budget,started_at,finished_at)`; `agent_steps(id,run_id,tool,arguments_redacted,status,result_ref,started_at)`; `approvals(id,tenant_id,action_type,payload_hash,preview_json,expires_at,approved_by,used_at,status)`; `tool_grants`.
- `connected_accounts(id,tenant_id,provider,scopes,token_ciphertext,expires_at,revoked_at)`; `notifications(id,tenant_id,user_id,type,entity_ref,read_at)`; `audit_logs(id,tenant_id,actor,action,target,metadata_redacted,at)`; `outbox_events`.

## Constraints

- Unique `(source_id,external_id)` when present; otherwise canonical URL+fingerprint strategy with merge review.
- Unique `(tenant_id,job_id)` for active application except intentional reapplication policy.
- Unique `(tenant_id,provider,provider_message_id)` for Gmail messages; unique watcher dedupe key.
- Immutable resume_versions after approval/submission; new edit = new version.
- Approval payload hash bound to exact send/submission content; single use.
- Tenant-scoped RLS or equivalent enforced centrally; shared global jobs must never expose tenant annotations.
- Object keys include random IDs, never plaintext PII or email.

## Retention

Default retention periods TBD. User-configurable export and deletion; handle backups and legally required audit records with disclosed exceptions. Store minimal raw HTML/screenshot evidence and redact secrets.
