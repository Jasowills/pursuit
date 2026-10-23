//! Local, allowlisted operational events. No exception payloads, paths, career data or secrets.
use serde::{Deserialize, Serialize};
use std::{
    collections::VecDeque,
    path::PathBuf,
    sync::{Arc, Mutex},
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::Manager;
const LIMIT: usize = 100;
const MAX_FILE: u64 = 64 * 1024;
const CODES: &[&str] = &[
    "app.started",
    "app.exited",
    "native.panic",
    "ui.crash",
    "ui.unhandled",
    "engine.failed",
    "storage.failed",
    "model.failed",
];
#[derive(Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct Event {
    at: u64,
    code: String,
}
struct State {
    folder: PathBuf,
    events: VecDeque<Event>,
    persisted: bool,
}
#[derive(Clone)]
pub struct Diagnostics(Arc<Mutex<State>>);
#[derive(Serialize)]
pub struct Report {
    schema: u8,
    app_version: &'static str,
    os: &'static str,
    architecture: &'static str,
    event_storage_available: bool,
    events_included: bool,
    events: Vec<Event>,
    privacy: &'static str,
}
fn private_write(path: &std::path::Path, data: &[u8]) -> std::io::Result<()> {
    use std::io::Write;
    let mut options = std::fs::OpenOptions::new();
    options.write(true).create(true).truncate(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let mut file = options.open(path)?;
    file.write_all(data)?;
    file.sync_all()
}
impl Diagnostics {
    pub fn open(folder: PathBuf) -> std::io::Result<Self> {
        std::fs::create_dir_all(&folder)?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&folder, std::fs::Permissions::from_mode(0o700))?;
        }
        let path = folder.join("events.json");
        let events = std::fs::metadata(&path)
            .ok()
            .filter(|m| m.len() <= MAX_FILE)
            .and_then(|_| std::fs::read(&path).ok())
            .and_then(|data| serde_json::from_slice::<Vec<Event>>(&data).ok())
            .unwrap_or_default()
            .into_iter()
            .filter(|e| CODES.contains(&e.code.as_str()))
            .rev()
            .take(LIMIT)
            .collect::<Vec<_>>();
        Ok(Self(Arc::new(Mutex::new(State {
            folder,
            events: events.into_iter().rev().collect(),
            persisted: true,
        }))))
    }
    pub fn record(&self, code: &str) -> Result<(), String> {
        if !CODES.contains(&code) {
            return Err("Unknown diagnostic event".into());
        }
        // A panic during an existing event write must never deadlock the panic hook.
        let mut state = self.0.try_lock().map_err(|_| "Diagnostics busy")?;
        state.events.push_back(Event {
            at: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
            code: code.into(),
        });
        while state.events.len() > LIMIT {
            state.events.pop_front();
        }
        let data = serde_json::to_vec(&state.events).map_err(|_| "Cannot encode diagnostics")?;
        state.persisted = private_write(&state.folder.join("events.json"), &data).is_ok();
        Ok(())
    }
    fn report(&self, include_events: bool) -> Result<Report, String> {
        let state = self.0.lock().map_err(|_| "Diagnostics busy")?;
        Ok(Report { schema: 1, app_version: env!("CARGO_PKG_VERSION"), os: std::env::consts::OS, architecture: std::env::consts::ARCH,
            event_storage_available: state.persisted, events_included: include_events,
            events: if include_events { state.events.iter().cloned().collect() } else { vec![] },
            privacy: "No resume, job content, conversation text, credentials, exception messages, stack traces, URLs or filesystem paths are collected. Nothing is uploaded automatically." })
    }
    fn clear(&self) -> Result<(), String> {
        let mut state = self.0.lock().map_err(|_| "Diagnostics busy")?;
        private_write(&state.folder.join("events.json"), b"[]")
            .map_err(|_| "Cannot clear diagnostic events")?;
        state.events.clear();
        state.persisted = true;
        Ok(())
    }
}
#[tauri::command]
pub fn record_diagnostic(log: tauri::State<Diagnostics>, code: String) -> Result<(), String> {
    log.record(&code)
}
#[tauri::command]
pub fn diagnostic_report(
    log: tauri::State<Diagnostics>,
    include_events: bool,
) -> Result<Report, String> {
    log.report(include_events)
}
#[tauri::command]
pub fn clear_diagnostics(log: tauri::State<Diagnostics>) -> Result<(), String> {
    log.clear()
}
pub fn install(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let log = Diagnostics::open(app.path().app_data_dir()?.join("diagnostics"))?;
    let panic_log = log.clone();
    std::panic::set_hook(Box::new(move |_| {
        let _ = panic_log.record("native.panic");
    }));
    let _ = log.record("app.started");
    app.manage(log);
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn refuses_payloads_and_bounds_events_across_restart() {
        let temp = tempfile::tempdir().unwrap();
        let log = Diagnostics::open(temp.path().to_path_buf()).unwrap();
        assert!(log.record("api-key=secret resume text").is_err());
        for _ in 0..150 {
            log.record("engine.failed").unwrap();
        }
        let restored = Diagnostics::open(temp.path().to_path_buf()).unwrap();
        let report = restored.report(true).unwrap();
        assert_eq!(report.events.len(), LIMIT);
        assert!(report.events.iter().all(|e| e.code == "engine.failed"));
        assert!(restored.report(false).unwrap().events.is_empty());
        let serialized = serde_json::to_string(&report).unwrap();
        assert!(!serialized.contains("api-key=secret"));
        restored.clear().unwrap();
        assert!(Diagnostics::open(temp.path().to_path_buf())
            .unwrap()
            .report(true)
            .unwrap()
            .events
            .is_empty());
    }
    #[test]
    fn rejects_poisoned_or_oversized_stored_logs() {
        let temp = tempfile::tempdir().unwrap();
        std::fs::write(
            temp.path().join("events.json"),
            br#"[{"at":1,"code":"ui.crash","message":"private text"}]"#,
        )
        .unwrap();
        assert!(Diagnostics::open(temp.path().to_path_buf())
            .unwrap()
            .report(true)
            .unwrap()
            .events
            .is_empty());
        std::fs::write(
            temp.path().join("events.json"),
            vec![b'x'; MAX_FILE as usize + 1],
        )
        .unwrap();
        assert!(Diagnostics::open(temp.path().to_path_buf())
            .unwrap()
            .report(true)
            .unwrap()
            .events
            .is_empty());
    }
}
