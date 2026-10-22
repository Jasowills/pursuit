use serde::Serialize;
use serde_json::{json, Value};
use std::time::Duration;
use zeroize::Zeroizing;

const PROVIDERS: [(&str, &str, &str); 6] = [
    ("openai", "OpenAI", "https://api.openai.com/v1/models"),
    (
        "anthropic",
        "Claude / Anthropic",
        "https://api.anthropic.com/v1/models?limit=1000",
    ),
    (
        "google",
        "Gemini",
        "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000",
    ),
    (
        "openrouter",
        "OpenRouter / Hermes",
        "https://openrouter.ai/api/v1/models",
    ),
    ("groq", "Groq", "https://api.groq.com/openai/v1/models"),
    (
        "opencode",
        "OpenCode hosted inference",
        "https://opencode.ai/inference/v1/models",
    ),
];
fn provider(id: &str) -> Result<(&'static str, &'static str, &'static str), String> {
    PROVIDERS
        .into_iter()
        .find(|p| p.0 == id)
        .ok_or("Unknown provider".into())
}
pub trait Secrets {
    fn get(&self, id: &str) -> Result<Option<Zeroizing<String>>, String>;
    fn set(&self, id: &str, key: &str) -> Result<(), String>;
    fn remove(&self, id: &str) -> Result<(), String>;
}
pub struct NativeSecrets;
fn entry(id: &str) -> Result<keyring::Entry, String> {
    provider(id)?;
    keyring::Entry::new("com.pursuit.desktop.providers", id)
        .map_err(|_| "The operating-system credential store is unavailable.".into())
}
impl Secrets for NativeSecrets {
    fn get(&self, id: &str) -> Result<Option<Zeroizing<String>>, String> {
        match entry(id)?.get_password() {
            Ok(key) => Ok(Some(Zeroizing::new(key))),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(_) => {
                Err("Unlock or enable the operating-system credential store and retry.".into())
            }
        }
    }
    fn set(&self, id: &str, key: &str) -> Result<(), String> {
        entry(id)?.set_password(key).map_err(|_|"Could not save the key. Unlock or enable the operating-system credential store and retry.".into())
    }
    fn remove(&self, id: &str) -> Result<(), String> {
        match entry(id)?.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(_) => {
                Err("Could not remove the key from the operating-system credential store.".into())
            }
        }
    }
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Connection {
    id: String,
    name: String,
    credential_saved: bool,
    store_error: Option<String>,
}
#[derive(Serialize, Debug, PartialEq)]
pub struct Catalog {
    pub models: Vec<String>,
    pub truncated: bool,
}
fn agent() -> ureq::Agent {
    ureq::Agent::config_builder()
        .proxy(None)
        .max_redirects(0)
        .timeout_global(Some(Duration::from_secs(45)))
        .build()
        .into()
}
fn authenticate(
    builder: ureq::RequestBuilder<ureq::typestate::WithoutBody>,
    id: &str,
    key: &str,
) -> ureq::RequestBuilder<ureq::typestate::WithoutBody> {
    match id {
        "anthropic" => builder
            .header("x-api-key", key)
            .header("anthropic-version", "2023-06-01"),
        "google" => builder.header("x-goog-api-key", key),
        _ => builder.header("Authorization", format!("Bearer {key}")),
    }
}
fn parse_catalog(id: &str, body: Value) -> Result<Catalog, String> {
    let array = body
        .get(if id == "google" { "models" } else { "data" })
        .and_then(Value::as_array)
        .ok_or("Provider returned an invalid catalog.")?;
    let mut models: Vec<String> = array
        .iter()
        .filter_map(|m| {
            m.get(if id == "google" { "name" } else { "id" })
                .and_then(Value::as_str)
        })
        .filter(|s| !s.is_empty() && s.len() <= 512)
        .map(str::to_owned)
        .collect();
    models.sort();
    models.dedup();
    Ok(Catalog {
        models,
        truncated: body
            .get("has_more")
            .and_then(Value::as_bool)
            .unwrap_or(false)
            || body.get("nextPageToken").and_then(Value::as_str).is_some(),
    })
}
pub(crate) fn catalog_with(secrets: &impl Secrets, id: &str) -> Result<Catalog, String> {
    provider(id)?;
    let key = secrets
        .get(id)?
        .ok_or("Save your provider API key first.")?;
    catalog_key(id, &key)
}
fn catalog_key(id: &str, key: &str) -> Result<Catalog, String> {
    let (_, _, url) = provider(id)?;
    let mut response = authenticate(agent().get(url), id, &key)
        .call()
        .map_err(|_| {
            "Catalog request failed. Check your key, network, and provider access; then retry."
                .to_string()
        })?;
    if !response.status().is_success() {
        return Err("Catalog returned an unexpected status. Redirects are not followed.".into());
    }
    let body: Value = response
        .body_mut()
        .with_config()
        .limit(4_000_000)
        .read_json()
        .map_err(|_| "Invalid provider response.".to_string())?;
    let mut catalog = parse_catalog(id, body)?;
    catalog.models.retain(|model| !model.contains(key));
    Ok(catalog)
}
fn connections_with(secrets: &impl Secrets) -> Vec<Connection> {
    PROVIDERS
        .into_iter()
        .map(|(id, name, _)| match secrets.get(id) {
            Ok(key) => Connection {
                id: id.into(),
                name: name.into(),
                credential_saved: key.is_some(),
                store_error: None,
            },
            Err(_) => Connection {
                id: id.into(),
                name: name.into(),
                credential_saved: false,
                store_error: Some(
                    "Unlock or enable the operating-system credential store and retry.".into(),
                ),
            },
        })
        .collect()
}
#[tauri::command]
pub async fn provider_connections() -> Result<Vec<Connection>, String> {
    tauri::async_runtime::spawn_blocking(|| Ok(connections_with(&NativeSecrets)))
        .await
        .map_err(|_| "Credential check interrupted".to_string())?
}
fn store_key(secrets: &impl Secrets, id: &str, key: &str) -> Result<(), String> {
    provider(id)?;
    let trimmed = key.trim();
    if trimmed.is_empty() || trimmed.len() > 8192 || trimmed.chars().any(char::is_control) {
        return Err(
            "Enter a valid provider key (maximum 8192 bytes, no control characters).".into(),
        );
    }
    secrets.set(id, trimmed)
}
#[tauri::command]
pub async fn save_provider_key(provider_id: String, key: String) -> Result<(), String> {
    let key = Zeroizing::new(key);
    tauri::async_runtime::spawn_blocking(move || store_key(&NativeSecrets, &provider_id, &key))
        .await
        .map_err(|_| "Credential save interrupted".to_string())?
}
#[tauri::command]
pub async fn remove_provider_key(provider_id: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || NativeSecrets.remove(&provider_id))
        .await
        .map_err(|_| "Credential removal interrupted".to_string())?
}
#[tauri::command]
pub async fn provider_models(provider_id: String) -> Result<Catalog, String> {
    tauri::async_runtime::spawn_blocking(move || catalog_with(&NativeSecrets, &provider_id))
        .await
        .map_err(|_| "Catalog check interrupted".to_string())?
}

// Explicit API-family selection is required for OpenCode: the catalog does not supply it.
pub(crate) fn generation_request(
    id: &str,
    model: &str,
    family: &str,
) -> Result<(String, Value), String> {
    provider(id)?;
    let prompt = "Reply with the word ready.";
    let (root, api) = match id {
        "openai" => ("https://api.openai.com/v1", "responses"),
        "anthropic" => ("https://api.anthropic.com/v1", "messages"),
        "google" => ("https://generativelanguage.googleapis.com/v1beta", "gemini"),
        "openrouter" => ("https://openrouter.ai/api/v1", "chat"),
        "groq" => ("https://api.groq.com/openai/v1", "chat"),
        "opencode" => match family {
            "chat" => ("https://opencode.ai/inference/openai/v1", "chat"),
            "responses" => ("https://opencode.ai/inference/openai/v1", "responses"),
            "messages" => ("https://opencode.ai/inference/anthropic/v1", "messages"),
            "gemini" => ("https://opencode.ai/inference/google/v1beta", "gemini"),
            _ => {
                return Err(
                    "Select the API family listed for this model in OpenCode Console.".into(),
                )
            }
        },
        _ => unreachable!(),
    };
    match api {
        "responses" => Ok((
            format!("{root}/responses"),
            json!({"model":model,"input":prompt,"max_output_tokens":128}),
        )),
        "messages" => Ok((
            format!("{root}/messages"),
            json!({"model":model,"max_tokens":128,"messages":[{"role":"user","content":prompt}]}),
        )),
        "gemini" => {
            let model = model.strip_prefix("models/").unwrap_or(model);
            if model.is_empty()
                || !model
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b"-_.".contains(&b))
            {
                return Err("Invalid Gemini model identifier.".into());
            }
            Ok((
                format!("{root}/models/{model}:generateContent"),
                json!({"contents":[{"parts":[{"text":prompt}]}],"generationConfig":{"maxOutputTokens":128}}),
            ))
        }
        _ => Ok((
            format!("{root}/chat/completions"),
            json!({"model":model,"max_tokens":128,"messages":[{"role":"user","content":prompt}]}),
        )),
    }
}
fn extract_text(body: &Value) -> Option<String> {
    if let Some(text) = body
        .pointer("/choices/0/message/content")
        .and_then(Value::as_str)
    {
        return Some(text.into());
    }
    let mut texts = Vec::new();
    if let Some(output) = body.get("output").and_then(Value::as_array) {
        for item in output {
            if let Some(content) = item.get("content").and_then(Value::as_array) {
                for part in content {
                    if let Some(text) = part.get("text").and_then(Value::as_str) {
                        texts.push(text)
                    }
                }
            }
        }
    }
    if let Some(content) = body.get("content").and_then(Value::as_array) {
        for part in content {
            if let Some(text) = part.get("text").and_then(Value::as_str) {
                texts.push(text)
            }
        }
    }
    if let Some(parts) = body
        .pointer("/candidates/0/content/parts")
        .and_then(Value::as_array)
    {
        for part in parts {
            if let Some(text) = part.get("text").and_then(Value::as_str) {
                texts.push(text)
            }
        }
    }
    if texts.is_empty() {
        None
    } else {
        Some(texts.join("\n"))
    }
}
#[tauri::command]
pub async fn test_provider(
    provider_id: String,
    model: String,
    family: String,
) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let key = NativeSecrets
            .get(&provider_id)?
            .ok_or("Save your provider key first.")?;
        if !catalog_key(&provider_id, &key)?.models.contains(&model) {
            return Err("Reload the catalog and select an available model.".into());
        }
        let (url, payload) = generation_request(&provider_id, &model, &family)?;

        let mut builder = agent().post(url);
        if provider_id == "anthropic" {
            builder = builder
                .header("x-api-key", key.as_str())
                .header("anthropic-version", "2023-06-01");
        } else if provider_id == "google" {
            builder = builder.header("x-goog-api-key", key.as_str());
        } else {
            builder = builder.header("Authorization", format!("Bearer {}", key.as_str()));
        }
        if provider_id == "opencode" && family == "messages" {
            builder = builder.header("anthropic-version", "2023-06-01");
        }
        let mut response = builder.send_json(payload).map_err(|_| {
            "Generation failed. Check model access, API family, credits and provider status."
                .to_string()
        })?;
        if !response.status().is_success() {
            return Err("Generation returned an unexpected status.".into());
        }
        let body: Value = response
            .body_mut()
            .with_config()
            .limit(1_000_000)
            .read_json()
            .map_err(|_| "Invalid generation response.".to_string())?;
        let text = extract_text(&body).filter(|s| !s.trim().is_empty()).ok_or(
            "Provider did not return text. This model or API family may not support this test.",
        )?;
        // Provider error bodies are never surfaced; defensively redact an echoed credential in model text.
        Ok(text.replace(key.as_str(), "[redacted]"))
    })
    .await
    .map_err(|_| "Generation check interrupted".to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    #[ignore = "Writes and deletes a temporary non-secret validation entry in the OS credential store"]
    fn native_credential_store_lifecycle() {
        let directory = tempfile::tempdir().unwrap();
        let username = directory.path().file_name().unwrap().to_str().unwrap();
        let entry = keyring::Entry::new("com.pursuit.desktop.validation", username)
            .expect("Credential store unavailable");
        entry
            .set_password("pursuit-validation-not-an-api-key")
            .expect("Credential-store write failed");
        let read = entry.get_password();
        let deletion = entry.delete_credential();
        assert!(
            deletion.is_ok(),
            "Could not remove temporary validation entry"
        );
        assert!(
            matches!(read,Ok(ref value) if value=="pursuit-validation-not-an-api-key"),
            "Credential-store read did not match"
        );
        assert!(
            matches!(entry.get_password(), Err(keyring::Error::NoEntry)),
            "Temporary credential was not removed"
        );
    }
    struct MemorySecrets(std::sync::Mutex<std::collections::HashMap<String, String>>);
    impl Secrets for MemorySecrets {
        fn get(&self, id: &str) -> Result<Option<Zeroizing<String>>, String> {
            Ok(self.0.lock().unwrap().get(id).cloned().map(Zeroizing::new))
        }
        fn set(&self, id: &str, key: &str) -> Result<(), String> {
            self.0.lock().unwrap().insert(id.into(), key.into());
            Ok(())
        }
        fn remove(&self, id: &str) -> Result<(), String> {
            self.0.lock().unwrap().remove(id);
            Ok(())
        }
    }
    #[test]
    fn credential_contract_never_serializes_key_and_blocks_missing_key_before_network() {
        let secrets = MemorySecrets(std::sync::Mutex::new(std::collections::HashMap::new()));
        assert!(catalog_with(&secrets, "openai").is_err());
        assert!(store_key(&secrets, "unknown", "fixture-secret").is_err());
        assert!(store_key(&secrets, "openai", "bad\nkey").is_err());
        store_key(&secrets, "openai", "fixture-secret").unwrap();
        let status = connections_with(&secrets);
        assert!(status[0].credential_saved);
        assert!(!serde_json::to_string(&status)
            .unwrap()
            .contains("fixture-secret"));
        secrets.remove("openai").unwrap();
        assert!(!connections_with(&secrets)[0].credential_saved);
    }
    #[test]
    fn catalogs_keep_nested_ids_and_pagination() {
        let c = parse_catalog(
            "openrouter",
            json!({"data":[{"id":"nousresearch/hermes-4:free"}],"has_more":true}),
        )
        .unwrap();
        assert_eq!(c.models[0], "nousresearch/hermes-4:free");
        assert!(c.truncated);
        assert!(parse_catalog("openai", json!({"error":"no"})).is_err());
    }
    #[test]
    fn routing_is_explicit_and_cannot_escape_fixed_hosts() {
        for family in ["chat", "responses", "messages", "gemini"] {
            let (url, _) = generation_request("opencode", "safe-model", family).unwrap();
            assert!(url.starts_with("https://opencode.ai/inference/"));
        }
        assert!(generation_request("opencode", "safe", "guess").is_err());
        assert!(generation_request("google", "../../secret", "gemini").is_err());
        assert!(provider("http://evil").is_err());
    }
    #[test]
    fn response_formats_extract_only_text() {
        assert_eq!(
            extract_text(&json!({"output":[{"content":[{"type":"output_text","text":"ready"}]}]})),
            Some("ready".into())
        );
        assert_eq!(
            extract_text(&json!({"content":[{"type":"text","text":"ready"}]})),
            Some("ready".into())
        );
        assert!(extract_text(&json!({"error":{"message":"secret"}})).is_none());
    }
}
