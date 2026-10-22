# Connect your model and Gmail

Pursuit supports two independent Gmail paths: Composio-managed Google authorization
and a direct Google OAuth client. A Gmail connector installed in Codex is separate
from the connections owned by users of Pursuit.

For an interactive local walkthrough, run `bash scripts/setup-connections.local.sh`
from the repository. It opens the relevant dashboards, hides secret input and saves
only local environment variables. It does not complete OAuth consent or send mail.

## Local API configuration

Copy missing variable names from `.env.example` into an ignored `.env` file. The
API loads the root `.env` at startup. Never paste secret values into chat or commit
them. Generate a persistent encryption key with `openssl rand -hex 32` and put its
output in `CONNECTION_ENCRYPTION_KEY`. If a key is already configured, keep it rather than generating a replacement.
Back it up securely: changing or losing it
makes saved provider keys and Google refresh tokens unreadable.

Set `WEB_URL=http://127.0.0.1:3000` for normal local development (the separate preview
uses `http://127.0.0.1:3001`), then restart the API after
configuration changes. The exact browser origin must agree with `WEB_URL` and CORS.

## Native Ollama versus retained web models

The desktop connects to local Ollama and runs a private tool-denied OpenCode
runtime. See the root README for native setup. The instructions below apply to
the separate retained web/API workflow, which currently accepts cloud-provider
keys and does not use the native Ollama connection. No live Gmail account was
connected in the 2026-10-22 audit; both unconfigured paths rejected locally.

## Bring your own model

1. Sign in to Pursuit and open Settings.
2. Choose OpenAI, Claude (Anthropic), Gemini (Google AI Studio), or Hermes.
3. Enter your own API key. Hermes currently uses an OpenRouter key and discovers
   Nous Research Hermes models from that catalog. Direct Nous Portal OAuth is not
   implemented. A chat subscription is not automatically an API credential.
4. Connect, choose a returned model, and click **Test & select**. The test makes a
   small inference request billed by that provider. Catalog access alone does not
   prove inference access or quota.
5. Open Search workflow. Preparation uses your verified connection. Disconnect in
   Settings to remove the encrypted key from Pursuit; revoke compromised keys with
   the provider as well.

## Gmail through Composio (no Google Cloud client needed for managed auth)

1. Create/sign in to a [Composio account](https://dashboard.composio.dev/).
2. Create a dedicated project for Pursuit, and create its project API key. Save the
   key locally as `COMPOSIO_API_KEY`.
3. In authentication configurations, create a Gmail OAuth configuration using
   **Composio-managed authentication**. Review the actual requested permissions.
   This release only sends approved messages; configure the narrowest available
   send scope. Do not request full mailbox access merely for future features.
4. Save that configuration ID as `COMPOSIO_GMAIL_AUTH_CONFIG_ID` and restart the API.
5. In Pursuit Settings, choose **Connect through Composio**, complete consent, and
   return to Pursuit. Refresh status. Only a remotely verified `ACTIVE` account is
   usable; returned query parameters never mark a connection active by themselves.
6. A prepared draft must have a verified recipient, saved edits, and an exact-message
   approval. Approval does not send it. **Send approved email** performs the send.
   Do not test this on a real contact without reviewing the message and recipient.
7. **Revoke Gmail access** revokes the Composio connection and removes its local
   reference. Each Pursuit user repeats consent for their own mailbox.

For a public deployment, enable Composio callback identity verification in the
project settings and set its verifier URL to `WEB_URL/app/settings` (public HTTPS;
local development needs a tunnel). Set `COMPOSIO_CALLBACK_VERIFICATION=true`.
The settings page passes the opaque `session_uri` to an authenticated API endpoint,
which completes authorization for the signed-in user's opaque identity and checks
the returned account against the stored pending connection. Until this succeeds,
the connection remains unusable in Pursuit. Local private development can use the
ordinary managed callback without the verifier; do not use that shortcut publicly.

## Direct Gmail OAuth

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project and
   enable Gmail API.
2. Configure the OAuth consent screen, application audience and test users. Request
   `openid`, `email`, and `https://www.googleapis.com/auth/gmail.send`.
3. Create a **Web application** OAuth client. Register the exact redirect URI:
   `http://127.0.0.1:3000/app/settings` locally, or `WEB_URL/app/settings` when hosted.
4. Save its ID and secret locally as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
5. Restart the API. Choose **Connect directly with Google** in Settings, then consent
   using a test-user account. The callback is authenticated against your Pursuit
   session and uses a short-lived, single-use state plus PKCE.
6. Google stores the mailbox grant; Pursuit encrypts the refresh token. Revoking
   access revokes that token with Google and deletes it locally.

Google's testing-mode refresh-token lifetime and public-app verification requirements
apply. Production identity and deployment hardening remain release gates.

## What is and is not verified

Automated tests use real local Postgres and mocked external transports. A live
provider test, OAuth consent, and a deliberate approved test send must pass before
advertising an integration as verified. A delivery timeout is ambiguous and locks
the draft as `NEEDS_VERIFICATION`; inspect Gmail Sent/Composio logs before acting.
The app never automatically retries that message.

Preparation currently accepts pasted or uploaded plain-text/Markdown resumes and
downloads plain-text versions. PDF/DOCX parsing/export, contact discovery, automatic
inbox/reply tracking, and isolated BYOM OpenCode workers remain separate work.

References: [Composio authentication](https://docs.composio.dev/docs/authentication),
[Gmail toolkit](https://docs.composio.dev/toolkits/gmail),
[Google web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server),
[Gmail send API](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send).
