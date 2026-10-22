use serde::Serialize;
use std::{
    io::Read,
    path::PathBuf,
    process::{Command, Stdio},
    time::{Duration, Instant},
};
use tauri::Manager;
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeProbe {
    version: String,
    isolated_directory: String,
}
fn probe(directory: PathBuf) -> Result<RuntimeProbe, String> {
    std::fs::create_dir_all(&directory)
        .map_err(|_| "Could not create Pursuit’s isolated runtime directory.".to_string())?;
    let mut command = Command::new("opencode");
    command
        .arg("--version")
        .current_dir(&directory)
        .env_clear()
        .env("PATH", std::env::var_os("PATH").unwrap_or_default())
        .env("XDG_CONFIG_HOME", directory.join("config"))
        .env("XDG_DATA_HOME", directory.join("data"))
        .env("XDG_STATE_HOME", directory.join("state"))
        .env("XDG_CACHE_HOME", directory.join("cache"))
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null());
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000);
        for name in ["SystemRoot", "TEMP", "TMP"] {
            if let Some(value) = std::env::var_os(name) {
                command.env(name, value);
            }
        }
    }
    let mut child=command.spawn().map_err(|_|"OpenCode was not found on the desktop app’s PATH. Install it, restart Pursuit, and retry. The bundled runtime is not available yet.".to_string())?;
    let started = Instant::now();
    loop {
        match child.try_wait() {
            Ok(Some(status)) => {
                if !status.success() {
                    return Err("OpenCode version check failed in the isolated directory.".into());
                }
                let mut output = String::new();
                if let Some(stdout) = child.stdout.take() {
                    stdout
                        .take(4096)
                        .read_to_string(&mut output)
                        .map_err(|_| "Invalid OpenCode version output.".to_string())?;
                }
                let version = output.trim();
                if version.is_empty()
                    || version.len() > 100
                    || version.chars().any(char::is_control)
                {
                    return Err("OpenCode returned an unexpected version string.".into());
                }
                return Ok(RuntimeProbe {
                    version: version.into(),
                    isolated_directory: directory.to_string_lossy().into_owned(),
                });
            }
            Ok(None) => {}
            Err(_) => {
                let _ = child.kill();
                let _ = child.wait();
                return Err("OpenCode process check failed.".into());
            }
        }
        if started.elapsed() > Duration::from_secs(8) {
            let _ = child.kill();
            let _ = child.wait();
            return Err("OpenCode version check timed out; the child process was stopped.".into());
        }
        std::thread::sleep(Duration::from_millis(50));
    }
}
#[tauri::command]
pub async fn probe_opencode(app: tauri::AppHandle) -> Result<RuntimeProbe, String> {
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|_| "Cannot locate runtime directory".to_string())?
        .join("opencode-probe");
    tauri::async_runtime::spawn_blocking(move || probe(directory))
        .await
        .map_err(|_| "OpenCode probe interrupted".to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    #[ignore = "Requires an installed OpenCode CLI; no model or credential is used"]
    fn installed_opencode_version_probe() {
        let directory = tempfile::tempdir().unwrap();
        let result = probe(directory.path().join("isolated")).unwrap();
        assert!(!result.version.is_empty());
        println!("Detected OpenCode {} in isolated probe", result.version);
    }
}
