use serde::{Deserialize, Serialize};
use std::time::Duration;

const ENDPOINT: &str = "http://127.0.0.1:11434";
#[derive(Deserialize)]
struct Catalog {
    models: Vec<Model>,
}
#[derive(Deserialize, Serialize)]
pub struct Model {
    name: String,
}
#[derive(Deserialize)]
struct Generation {
    response: String,
    done: bool,
}
fn agent(timeout: u64) -> ureq::Agent {
    ureq::Agent::config_builder()
        .proxy(None)
        .max_redirects(0)
        .timeout_global(Some(Duration::from_secs(timeout)))
        .build()
        .into()
}
fn catalog_at(endpoint: &str) -> Result<Vec<Model>, String> {
    let mut response = agent(5)
        .get(format!("{endpoint}/api/tags"))
        .call()
        .map_err(|_| {
            "Cannot reach Ollama. Start Ollama locally on port 11434, then retry.".to_string()
        })?;
    if !response.status().is_success() {
        return Err("Ollama returned an unexpected status. Redirects are not followed.".into());
    }
    let catalog: Catalog = response
        .body_mut()
        .with_config()
        .limit(1_000_000)
        .read_json()
        .map_err(|_| "Ollama returned an invalid model list.".to_string())?;
    Ok(catalog.models)
}
#[tauri::command]
pub async fn ollama_models() -> Result<Vec<Model>, String> {
    tauri::async_runtime::spawn_blocking(|| catalog_at(ENDPOINT))
        .await
        .map_err(|_| "Ollama check interrupted".to_string())?
}
#[tauri::command]
pub async fn test_ollama(model: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        if !catalog_at(ENDPOINT)?.iter().any(|m|m.name==model) {return Err("Choose a model from the current Ollama list.".into());}
        let mut response=agent(60).post(format!("{ENDPOINT}/api/generate")).send_json(serde_json::json!({"model":model,"prompt":"Reply with the word ready.","stream":false,"options":{"num_predict":16},"keep_alive":"0s"})).map_err(|_|"Model test failed or timed out. Check Ollama and retry.".to_string())?;
        if !response.status().is_success(){return Err("Ollama returned an unexpected status.".into());}
        let result:Generation=response.body_mut().with_config().limit(100_000).read_json().map_err(|_|"Invalid Ollama generation response.".to_string())?;
        if !result.done || result.response.trim().is_empty() {return Err("Ollama did not return a completed text response. This model may not support text generation.".into());}
        Ok(result.response)
    }).await.map_err(|_|"Model test interrupted".to_string())?
}
#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        io::{Read, Write},
        net::TcpListener,
    };
    fn fixture(status: &str, body: &str) -> String {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let address = listener.local_addr().unwrap();
        let response=format!("HTTP/1.1 {status}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",body.len());
        std::thread::spawn(move || {
            let (mut stream, _) = listener.accept().unwrap();
            let mut input = [0; 4096];
            let _ = stream.read(&mut input);
            stream.write_all(response.as_bytes()).unwrap();
        });
        format!("http://{address}")
    }
    #[test]
    fn preserves_complete_model_names_and_rejects_bad_data() {
        let models = catalog_at(&fixture(
            "200 OK",
            r#"{"models":[{"name":"org/model:tag"}]}"#,
        ))
        .unwrap();
        assert_eq!(models[0].name, "org/model:tag");
        assert!(catalog_at(&fixture("200 OK", "not json")).is_err());
        assert!(catalog_at(&fixture("302 Found", "{}")).is_err());
    }
}

pub(crate) fn catalog_names() -> Result<Vec<String>, String> {
    Ok(catalog_at(ENDPOINT)?.into_iter().map(|m| m.name).collect())
}
