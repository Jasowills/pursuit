use crate::Core;
use base64::Engine;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
    io::{BufRead, BufReader, Read, Write},
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::{
        atomic::{AtomicBool, Ordering},
        mpsc, Arc, Mutex, Weak,
    },
    time::{Duration, Instant},
};
use tauri::{Emitter, Manager};

#[derive(Default)]
pub struct CareerEngineState {
    busy: AtomicBool,
    closing: AtomicBool,
    children: Mutex<Vec<Weak<Mutex<Child>>>>,
}
impl CareerEngineState {
    pub fn shutdown(&self) {
        self.closing.store(true, Ordering::SeqCst);
        if let Ok(children) = self.children.lock() {
            for child in children.iter().filter_map(Weak::upgrade) {
                if let Ok(mut child) = child.lock() {
                    stop_child(&mut child);
                }
            }
        }
    }
}
#[derive(Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct EngineSettings {
    pub node_executable: String,
    pub browser_executable: String,
    pub execution_enabled: bool,
}
fn folder(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map(|p| p.join("career-engine"))
        .map_err(|_| "Local storage unavailable".into())
}
fn load(app: &tauri::AppHandle) -> Result<EngineSettings, String> {
    let p = folder(app)?.join("runtime.json");
    if p.exists() {
        serde_json::from_slice(&std::fs::read(p).map_err(|_| "Cannot read engine setup")?)
            .map_err(|_| "Invalid engine setup".into())
    } else {
        Ok(EngineSettings {
            node_executable: find_node(),
            browser_executable: find_browser(),
            execution_enabled: false,
        })
    }
}
fn executable(path: &str) -> Result<(), String> {
    if path.len() > 2000 || !Path::new(path).is_absolute() || !Path::new(path).is_file() {
        return Err("Choose an absolute path to an installed executable".into());
    }
    Ok(())
}
fn find_node() -> String {
    let mut candidates: Vec<PathBuf> =
        std::env::split_paths(&std::env::var_os("PATH").unwrap_or_default())
            .map(|p| p.join(if cfg!(windows) { "node.exe" } else { "node" }))
            .collect();
    for p in [
        "/opt/homebrew/bin/node",
        "/usr/local/bin/node",
        "/usr/bin/node",
    ] {
        candidates.push(p.into());
    }
    candidates
        .into_iter()
        .find(|p| p.is_file())
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default()
}
fn find_browser() -> String {
    let paths = if cfg!(target_os = "macos") {
        vec![
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Chromium.app/Contents/MacOS/Chromium",
        ]
    } else if cfg!(target_os = "windows") {
        vec![
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        ]
    } else {
        vec![
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
            "/usr/bin/google-chrome",
        ]
    };
    paths
        .into_iter()
        .find(|p| Path::new(p).is_file())
        .unwrap_or("")
        .into()
}
#[tauri::command]
pub fn career_engine_settings(app: tauri::AppHandle) -> Result<EngineSettings, String> {
    load(&app)
}
#[tauri::command]
pub fn save_career_engine_settings(
    app: tauri::AppHandle,
    settings: EngineSettings,
    state: tauri::State<CareerEngineState>,
) -> Result<EngineSettings, String> {
    if state.busy.load(Ordering::SeqCst) {
        return Err("Wait for the current career action to finish".into());
    }
    executable(&settings.node_executable)?;
    if !settings.browser_executable.is_empty() {
        executable(&settings.browser_executable)?;
    }
    if settings.execution_enabled && settings.browser_executable.is_empty() {
        return Err("A browser executable is required for application execution".into());
    }
    let root = folder(&app)?;
    private_directory(&root)?;
    let path = root.join("runtime.json");
    let mut file = std::fs::OpenOptions::new();
    file.write(true).create(true).truncate(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        file.mode(0o600);
    }
    file.open(path)
        .and_then(|mut f| f.write_all(serde_json::to_string(&settings).unwrap().as_bytes()))
        .map_err(|_| "Cannot save engine setup")?;
    Ok(settings)
}
fn runtime_script(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    #[cfg(debug_assertions)]
    {
        let p = Path::new(env!("CARGO_MANIFEST_DIR")).join("../engine/worker.cjs");
        if p.is_file() {
            return Ok(p);
        }
    }
    let p = app
        .path()
        .resolve("engine/worker.cjs", tauri::path::BaseDirectory::Resource)
        .map_err(|_| "Engine resources unavailable")?;
    if !p.is_file() {
        return Err("Build the local engine resources before starting Pursuit".into());
    }
    Ok(p)
}
fn run(
    app: &tauri::AppHandle,
    request_id: &str,
    request: Value,
    settings: EngineSettings,
) -> Result<Value, String> {
    let root = folder(app)?;
    let script = runtime_script(app)?;
    let state = app.state::<CareerEngineState>();
    execute(
        &root,
        &script,
        request,
        settings,
        |event| {
            let _ = app.emit(
                "career-engine-progress",
                json!({"requestId":request_id,"event":event}),
            );
        },
        Some(&state),
    )
}
fn stop_child(child: &mut Child) {
    if matches!(child.try_wait(), Ok(Some(_))) {
        return;
    }
    #[cfg(unix)]
    {
        // Playwright's SIGTERM handler closes its isolated browser before Node exits.
        let _ = Command::new("/bin/kill")
            .args(["-TERM", &child.id().to_string()])
            .status();
        for _ in 0..20 {
            if matches!(child.try_wait(), Ok(Some(_))) {
                return;
            }
            std::thread::sleep(Duration::from_millis(100));
        }
    }
    #[cfg(windows)]
    {
        let system = std::env::var_os("SystemRoot")
            .map(PathBuf::from)
            .unwrap_or_else(|| PathBuf::from(r"C:\Windows"));
        let _ = Command::new(system.join("System32/taskkill.exe"))
            .args(["/PID", &child.id().to_string(), "/T", "/F"])
            .status();
    }
    let _ = child.kill();
    let _ = child.wait();
}
fn private_directory(path: &Path) -> Result<(), String> {
    std::fs::create_dir_all(path).map_err(|_| "Cannot create engine storage")?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o700))
            .map_err(|_| "Cannot protect engine storage")?;
    }
    Ok(())
}
fn execute(
    root: &Path,
    script: &Path,
    request: Value,
    settings: EngineSettings,
    progress: impl Fn(Value),
    state: Option<&CareerEngineState>,
) -> Result<Value, String> {
    executable(&settings.node_executable)?;
    private_directory(root)?;
    let mut command = Command::new(&settings.node_executable);
    command
        .arg("--disable-warning=ExperimentalWarning")
        .arg(script)
        .arg(&root)
        .arg(&settings.browser_executable)
        .arg(if settings.execution_enabled {
            "enabled"
        } else {
            "disabled"
        })
        .current_dir(&root)
        .env_clear();
    for name in [
        "PATH",
        "HOME",
        "USERPROFILE",
        "SystemRoot",
        "TEMP",
        "TMP",
        "TMPDIR",
        "LANG",
        "LC_ALL",
        "TZ",
    ] {
        if let Some(value) = std::env::var_os(name) {
            command.env(name, value);
        }
    }
    command
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null());
    let child = Arc::new(Mutex::new(command.spawn().map_err(|_| {
        "Cannot start Node. Choose Node 22.13 or later in sourcing setup."
    })?));
    if let Some(state) = state {
        let mut children = state
            .children
            .lock()
            .map_err(|_| "Engine process registry unavailable")?;
        if state.closing.load(Ordering::SeqCst) {
            stop_child(&mut child.lock().unwrap());
            return Err("Pursuit is closing".into());
        }
        children.retain(|child| child.strong_count() > 0);
        children.push(Arc::downgrade(&child));
    }
    let body = serde_json::to_vec(&request).map_err(|_| "Invalid career request")?;
    if body.len() > 4_000_000 {
        stop_child(&mut child.lock().unwrap());
        return Err("Career request too large".into());
    }
    let mut input = child.lock().unwrap().stdin.take().unwrap();
    let write_result = input.write_all(&body);
    drop(input);
    if write_result.is_err() {
        stop_child(&mut child.lock().unwrap());
        return Err("Cannot send career request".into());
    }
    let output = child.lock().unwrap().stdout.take().unwrap();
    let (tx, rx) = mpsc::channel();
    std::thread::spawn(move || {
        for line in BufReader::new(output.take(4_000_001)).lines() {
            match line {
                Ok(v) => {
                    if tx.send(v).is_err() {
                        break;
                    }
                }
                Err(_) => break,
            }
        }
    });
    let started = Instant::now();
    let mut result = None;
    loop {
        if started.elapsed() > Duration::from_secs(180) {
            stop_child(&mut child.lock().unwrap());
            return Err("Career action timed out. Refresh its state before retrying; a submission may need verification.".into());
        }
        match rx.recv_timeout(Duration::from_millis(100)) {
            Ok(line) => {
                if line.len() > 4_000_000 {
                    stop_child(&mut child.lock().unwrap());
                    return Err("Career response exceeded its limit".into());
                }
                if let Ok(event) = serde_json::from_str::<Value>(&line) {
                    match event["type"].as_str() {
                        Some("progress") => {
                            progress(event["event"].clone());
                        }
                        Some("result") => result = Some(Ok(event["value"].clone())),
                        Some("error") => {
                            let code = event["error"].as_str().unwrap_or("career_action_failed");
                            let safe = code.len() < 160
                                && code.bytes().all(|b| {
                                    b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'_'
                                });
                            result = Some(Err(if safe {
                                code.to_string()
                            } else {
                                "career_action_failed".into()
                            }));
                        }
                        _ => {}
                    }
                }
            }
            Err(mpsc::RecvTimeoutError::Disconnected) => {
                let _ = child.lock().unwrap().wait();
                return result.unwrap_or_else(||Err("Engine exited without a result. Verify Node 22.13 or later and refresh before retrying.".into()));
            }
            Err(mpsc::RecvTimeoutError::Timeout) => {}
        }
    }
}
#[tauri::command]
pub async fn career_engine_call(
    app: tauri::AppHandle,
    core: tauri::State<'_, Core>,
    state: tauri::State<'_, CareerEngineState>,
    request_id: String,
    mut request: Value,
) -> Result<Value, String> {
    if state
        .busy
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        return Err("A career action is already running".into());
    }
    let result=async{
  if request_id.is_empty() || request_id.len()>100 || !request_id.bytes().all(|b|b.is_ascii_alphanumeric()||b==b'-'){return Err("Invalid request ID".into());}
  if request["action"]=="packet.register" {
   let store=core.0.lock().map_err(|_|"Workspace is busy")?;
   let book:Value=serde_json::from_str(&store.career_book().map_err(|_|"Cannot read career book")?.ok_or("Prepare your resume packet first")?).map_err(|_|"Invalid career book")?;
   let tailoring=&book["tailoring"];
   let hash=tailoring["artifactHash"].as_str().ok_or("Build and save the tailored PDF first")?;
   let job_id=request["jobId"].as_str().ok_or("Choose a sourced role")?.to_string();
   let pdf=store.resume_pdf(hash).map_err(|_|"Saved PDF not found")?;
   request=json!({"action":"packet.register","jobId":job_id,"resume":tailoring["resume"],"packet":tailoring["packet"],"pdfHash":hash,"pdfBase64":base64::engine::general_purpose::STANDARD.encode(pdf)});
  }
  let settings=load(&app)?;
  let cloned=app.clone();
  tauri::async_runtime::spawn_blocking(move||run(&cloned,&request_id,request,settings)).await.map_err(|_|"Career engine task failed".to_string())?
 }.await;
    state.busy.store(false, Ordering::SeqCst);
    result
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn packaged_engine_round_trips_from_rust_without_web_account() {
        let root = tempfile::tempdir().unwrap();
        let script = Path::new(env!("CARGO_MANIFEST_DIR")).join("../engine/worker.cjs");
        assert!(
            script.is_file(),
            "Run pnpm --filter @pursuit/desktop engine:bundle first"
        );
        let settings = EngineSettings {
            node_executable: find_node(),
            browser_executable: String::new(),
            execution_enabled: false,
        };
        let first = execute(
            root.path(),
            &script,
            json!({"action":"snapshot"}),
            settings.clone(),
            |_| {},
            None,
        )
        .unwrap();
        assert_eq!(first["policy"]["enabled"], false);
        assert_eq!(first["matches"].as_array().unwrap().len(), 0);
        execute(
            root.path(),
            &script,
            json!({"action":"source.add","url":"https://jobs.ashbyhq.com/test"}),
            settings.clone(),
            |_| {},
            None,
        )
        .unwrap();
        let second = execute(
            root.path(),
            &script,
            json!({"action":"snapshot"}),
            settings.clone(),
            |_| {},
            None,
        )
        .unwrap();
        assert_eq!(second["sources"][0]["provider"], "ashby");
        assert!(execute(
            root.path(),
            &script,
            json!({"action":"shell","command":"ignored"}),
            settings,
            |_| {},
            None,
        )
        .is_err());
    }
    #[test]
    fn closing_the_host_terminates_its_worker_and_refuses_new_work() {
        let root = tempfile::tempdir().unwrap();
        let script = root.path().join("waiting.cjs");
        std::fs::write(&script,"process.stdout.write(JSON.stringify({type:'progress',event:{phase:'waiting'}})+'\\n');setInterval(()=>{},1000);").unwrap();
        let state = Arc::new(CareerEngineState::default());
        let settings = EngineSettings {
            node_executable: find_node(),
            browser_executable: String::new(),
            execution_enabled: false,
        };
        let owned_state = state.clone();
        let path = root.path().to_path_buf();
        let executable = script.clone();
        let config = settings.clone();
        let (tx, rx) = mpsc::channel();
        let work = std::thread::spawn(move || {
            execute(
                &path,
                &executable,
                json!({"action":"snapshot"}),
                config,
                |_| {
                    let _ = tx.send(());
                },
                Some(&owned_state),
            )
        });
        rx.recv_timeout(Duration::from_secs(10)).unwrap();
        state.shutdown();
        assert!(work.join().unwrap().is_err());
        assert!(state
            .children
            .lock()
            .unwrap()
            .iter()
            .all(|child| child.strong_count() == 0));
        assert!(execute(
            root.path(),
            &script,
            json!({"action":"snapshot"}),
            settings,
            |_| {},
            Some(&state)
        )
        .is_err());
    }
    #[test]
    fn rejects_non_absolute_executables() {
        assert!(executable("node --eval something").is_err());
        assert!(executable("/missing/pursuit-node").is_err());
    }
}

#[tauri::command]
pub async fn career_engine_pause(app: tauri::AppHandle) -> Result<Value, String> {
    let settings = load(&app)?;
    tauri::async_runtime::spawn_blocking(move || {
        run(
            &app,
            "pause",
            json!({"action":"application.pause"}),
            settings,
        )
    })
    .await
    .map_err(|_| "Pause request failed".to_string())?
}

fn external_url(raw: &str) -> Result<String, String> {
    if raw.len() > 4000 || raw.chars().any(|c| c.is_control()) {
        return Err("Invalid source URL".into());
    }
    let url = tauri::Url::parse(raw).map_err(|_| "Invalid source URL")?;
    if url.scheme() != "https"
        || !url.username().is_empty()
        || url.password().is_some()
        || url.host_str().is_none()
    {
        return Err("Only public HTTPS source links can be opened".into());
    }
    let host = url.host_str().unwrap();
    if host == "localhost"
        || host.ends_with(".localhost")
        || host.parse::<std::net::IpAddr>().is_ok()
        || host.starts_with('[')
    {
        return Err("Use a public employer website".into());
    }
    Ok(url.to_string())
}
#[tauri::command]
pub fn open_career_source(url: String) -> Result<(), String> {
    let url = external_url(&url)?;
    #[cfg(target_os = "macos")]
    let mut command = Command::new("/usr/bin/open");
    #[cfg(target_os = "linux")]
    let mut command = Command::new("xdg-open");
    #[cfg(target_os = "windows")]
    let mut command = {
        let system = std::env::var_os("SystemRoot")
            .map(PathBuf::from)
            .unwrap_or_else(|| PathBuf::from(r"C:\Windows"));
        let mut c = Command::new(system.join("System32/rundll32.exe"));
        c.arg("url.dll,FileProtocolHandler");
        c
    };
    command
        .arg(url)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map(|mut child| {
            std::thread::spawn(move || {
                let _ = child.wait();
            });
        })
        .map_err(|_| "Cannot open your browser. Copy the source URL instead.".into())
}
#[cfg(test)]
mod source_link_tests {
    use super::*;
    #[test]
    fn source_links_are_https_without_credentials_or_local_targets() {
        assert!(external_url("javascript:alert(1)").is_err());
        assert!(external_url("https://user:secret@jobs.ashbyhq.com/x").is_err());
        assert!(external_url("https://127.0.0.1/").is_err());
        assert_eq!(
            external_url("https://jobs.ashbyhq.com/company/job").unwrap(),
            "https://jobs.ashbyhq.com/company/job"
        );
    }
}
