#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

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
fn main() {
    tauri::Builder::default()
        .manage(managed::ManagedRuntime::default())
        .setup(|app| {
            let folder = app.path().app_data_dir()?;
            std::fs::create_dir_all(&folder)?;
            let store = Store::open(folder.join("workspace.sqlite"))?;
            app.manage(Core(Mutex::new(store)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            workspace,
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
                if let Ok(mut runtime) = app.state::<managed::ManagedRuntime>().0.lock() {
                    drop(runtime.take());
                }
            }
        });
}
