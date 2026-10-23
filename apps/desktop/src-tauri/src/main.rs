#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod career_engine;
mod diagnostics;

mod connections;
mod live;
mod managed;
mod models;
mod runtime;

use pursuit_local_store::{Identity, Store, Task, Workspace};
use std::sync::Mutex;
use tauri::Manager;

struct Core(Mutex<Store>);
#[tauri::command]
fn workspace(core: tauri::State<Core>) -> Result<Workspace, String> {
    core.0
        .lock()
        .map_err(|_| "Workspace is busy. Restart Pursuit.".to_string())?
        .workspace()
        .map_err(|e| e.to_string())
}
#[tauri::command]
fn career_book(core: tauri::State<Core>) -> Result<Option<String>, String> {
    core.0
        .lock()
        .map_err(|_| "Workspace is busy".to_string())?
        .career_book()
        .map_err(|e| e.to_string())
}
#[tauri::command]
fn save_career_book(core: tauri::State<Core>, body: String) -> Result<(), String> {
    core.0
        .lock()
        .map_err(|_| "Workspace is busy".to_string())?
        .save_career_book(&body)
        .map_err(|e| e.to_string())
}
#[tauri::command]
fn save_task(core: tauri::State<Core>, title: String) -> Result<Task, String> {
    core.0
        .lock()
        .map_err(|_| "Workspace is busy. Restart Pursuit.".to_string())?
        .save_task(&title)
        .map_err(|e| e.to_string())
}
#[tauri::command]
fn identity(core: tauri::State<Core>) -> Result<Identity, String> {
    core.0
        .lock()
        .map_err(|_| "Workspace is busy".to_string())?
        .identity()
        .map_err(|e| e.to_string())
}
#[tauri::command]
fn import_identity(
    core: tauri::State<Core>,
    name: String,
    text: String,
) -> Result<Identity, String> {
    core.0
        .lock()
        .map_err(|_| "Workspace is busy".to_string())?
        .import_identity(&name, &text)
        .map_err(|e| e.to_string())
}
#[tauri::command]
fn decide_fact(
    core: tauri::State<Core>,
    id: String,
    decision: String,
    value: String,
    expected_confirmed_id: Option<String>,
) -> Result<Identity, String> {
    core.0
        .lock()
        .map_err(|_| "Workspace is busy".to_string())?
        .decide_fact(&id, &decision, &value, expected_confirmed_id.as_deref())
        .map_err(|e| e.to_string())
}
#[tauri::command]
fn delete_identity_source(
    core: tauri::State<Core>,
    id: String,
    expected_hash: String,
) -> Result<Identity, String> {
    core.0
        .lock()
        .map_err(|_| "Workspace is busy".to_string())?
        .delete_identity_source(&id, &expected_hash)
        .map_err(|e| e.to_string())
}
#[tauri::command]
fn save_resume_pdf(core: tauri::State<Core>, hash: String, bytes: Vec<u8>) -> Result<(), String> {
    core.0
        .lock()
        .map_err(|_| "Workspace is busy".to_string())?
        .save_resume_pdf(&hash, &bytes)
        .map_err(|_| "PDF integrity check or storage failed".to_string())
}
#[tauri::command]
fn export_resume_pdf(
    app: tauri::AppHandle,
    core: tauri::State<Core>,
    hash: String,
) -> Result<String, String> {
    let bytes = core
        .0
        .lock()
        .map_err(|_| "Workspace is busy".to_string())?
        .resume_pdf(&hash)
        .map_err(|_| "Saved PDF not found".to_string())?;
    let folder = app
        .path()
        .document_dir()
        .map_err(|_| "Documents folder unavailable".to_string())?
        .join("Pursuit");
    std::fs::create_dir_all(&folder).map_err(|_| "Cannot create export folder".to_string())?;
    let path = folder.join(format!("resume-{}.pdf", hash));
    use std::io::Write;
    let mut options = std::fs::OpenOptions::new();
    options.write(true).create(true).truncate(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    options
        .open(&path)
        .and_then(|mut f| f.write_all(&bytes))
        .map_err(|_| "Cannot export PDF".to_string())?;
    Ok(path.to_string_lossy().into_owned())
}
fn main() {
    tauri::Builder::default()
        .manage(managed::ManagedRuntime::default())
        .manage(career_engine::CareerEngineState::default())
        .setup(|app| {
            // Diagnostics must never prevent opening an otherwise valid workspace.
            let _ = diagnostics::install(app);
            let folder = app.path().app_data_dir()?;
            std::fs::create_dir_all(&folder)?;
            let store = Store::open(folder.join("workspace.sqlite"))?;
            app.manage(Core(Mutex::new(store)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            diagnostics::record_diagnostic,
            diagnostics::diagnostic_report,
            diagnostics::clear_diagnostics,
            career_engine::career_engine_settings,
            career_engine::career_engine_pause,
            career_engine::open_career_source,
            career_engine::save_career_engine_settings,
            career_engine::career_engine_call,
            workspace,
            career_book,
            save_resume_pdf,
            export_resume_pdf,
            save_career_book,
            save_task,
            identity,
            import_identity,
            decide_fact,
            delete_identity_source,
            models::ollama_models,
            runtime::probe_opencode,
            managed::managed_start,
            managed::managed_stop,
            managed::managed_status,
            managed::managed_create,
            managed::managed_history,
            managed::managed_view,
            managed::managed_prompt,
            managed::managed_interrupt,
            connections::provider_connections,
            connections::save_provider_key,
            connections::remove_provider_key,
            connections::provider_models,
            connections::test_provider,
            models::test_ollama
        ])
        .build(tauri::generate_context!())
        .expect("Pursuit could not start")
        .run(|app, event| {
            if matches!(event, tauri::RunEvent::Exit) {
                if let Some(log) = app.try_state::<diagnostics::Diagnostics>() {
                    let _ = log.record("app.exited");
                }
                app.state::<career_engine::CareerEngineState>().shutdown();
                if let Ok(mut runtime) = app.state::<managed::ManagedRuntime>().0.lock() {
                    drop(runtime.take());
                }
            }
        });
}
