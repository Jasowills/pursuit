mod sessions;
pub use sessions::SessionRecord;
mod identity;
pub use identity::{Fact, Identity};
use rusqlite::{params, Connection, Result};
use serde::Serialize;
use std::path::{Path, PathBuf};
use uuid::Uuid;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub title: String,
    pub status: String,
    pub created_at: String,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    pub database_path: String,
    pub schema_version: i64,
    pub tasks: Vec<Task>,
}
pub struct Store {
    connection: Connection,
    path: PathBuf,
}
impl Store {
    pub fn open(path: impl AsRef<Path>) -> Result<Self> {
        let connection = Connection::open(path.as_ref())?;
        connection.busy_timeout(std::time::Duration::from_secs(5))?;
        connection.execute_batch(
            "PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;",
        )?;
        let version: i64 = connection.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if version > 3 {
            return Err(rusqlite::Error::InvalidQuery);
        }
        if version == 0 {
            connection.execute_batch(
                "BEGIN IMMEDIATE;
                CREATE TABLE tasks (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 2000),
                    status TEXT NOT NULL CHECK(status IN ('saved','running','completed','failed')),
                    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                );
                CREATE TABLE task_events (
                    sequence INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_id TEXT NOT NULL REFERENCES tasks(id),
                    kind TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                );
                PRAGMA user_version=1;
                COMMIT;",
            )?;
        }
        let version: i64 = connection.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if version == 1 {
            connection.execute_batch("BEGIN IMMEDIATE;
                CREATE TABLE identity_sources (id TEXT PRIMARY KEY,name TEXT NOT NULL,body TEXT NOT NULL,content_hash TEXT NOT NULL UNIQUE,extractor_version TEXT NOT NULL DEFAULT 'labeled-text-v1',created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
                CREATE TABLE identity_facts (id TEXT PRIMARY KEY,source_id TEXT NOT NULL REFERENCES identity_sources(id),field TEXT NOT NULL,value TEXT NOT NULL,excerpt TEXT NOT NULL,line_number INTEGER NOT NULL CHECK(line_number>0),status TEXT NOT NULL CHECK(status IN ('suggested','confirmed','rejected','superseded')),confirmed_value TEXT);
                CREATE UNIQUE INDEX one_confirmed_fact_per_field ON identity_facts(field) WHERE status='confirmed';
                CREATE TABLE identity_decisions (sequence INTEGER PRIMARY KEY AUTOINCREMENT,fact_id TEXT NOT NULL REFERENCES identity_facts(id),decision TEXT NOT NULL CHECK(decision IN ('confirm','reject')),value TEXT,created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
                PRAGMA user_version=2; COMMIT;")?;
        }
        let version: i64 = connection.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if version == 2 {
            connection.execute_batch("BEGIN IMMEDIATE; CREATE TABLE runtime_sessions(id TEXT PRIMARY KEY,title TEXT NOT NULL,provider TEXT NOT NULL,model TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'idle',snapshot TEXT NOT NULL DEFAULT '[]',created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))); PRAGMA user_version=3; COMMIT;")?;
        }
        Ok(Self {
            connection,
            path: path.as_ref().to_path_buf(),
        })
    }
    pub fn workspace(&self) -> Result<Workspace> {
        let mut statement = self.connection.prepare(
            "SELECT id,title,status,created_at FROM tasks ORDER BY created_at DESC,rowid DESC",
        )?;
        let tasks = statement
            .query_map([], |r| {
                Ok(Task {
                    id: r.get(0)?,
                    title: r.get(1)?,
                    status: r.get(2)?,
                    created_at: r.get(3)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;
        Ok(Workspace {
            database_path: self.path.to_string_lossy().into_owned(),
            schema_version: 3,
            tasks,
        })
    }
    pub fn save_task(&mut self, title: &str) -> Result<Task> {
        let title = title.trim();
        if title.is_empty() || title.chars().count() > 2000 {
            return Err(rusqlite::Error::InvalidParameterName(
                "Task must contain 1–2000 characters".into(),
            ));
        }
        let id = Uuid::new_v4().to_string();
        let transaction = self.connection.transaction()?;
        transaction.execute(
            "INSERT INTO tasks(id,title,status) VALUES(?1,?2,'saved')",
            params![id, title],
        )?;
        transaction.execute(
            "INSERT INTO task_events(task_id,kind) VALUES(?1,'task.saved')",
            [&id],
        )?;
        let created_at =
            transaction.query_row("SELECT created_at FROM tasks WHERE id=?1", [&id], |r| {
                r.get(0)
            })?;
        transaction.commit()?;
        Ok(Task {
            id,
            title: title.into(),
            status: "saved".into(),
            created_at,
        })
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn restart_retains_task_and_event() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("workspace.sqlite");
        let id = {
            let mut store = Store::open(&path).unwrap();
            store.save_task("  Research a role  ").unwrap().id
        };
        let store = Store::open(&path).unwrap();
        let workspace = store.workspace().unwrap();
        assert_eq!(workspace.tasks.len(), 1);
        assert_eq!(workspace.tasks[0].id, id);
        assert_eq!(workspace.tasks[0].title, "Research a role");
        assert_eq!(
            store
                .connection
                .query_row("SELECT count(*) FROM task_events", [], |r| r
                    .get::<_, i64>(0))
                .unwrap(),
            1
        );
    }
    #[test]
    fn failed_event_append_rolls_back_task() {
        let mut store = Store::open(":memory:").unwrap();
        store.connection.execute_batch("CREATE TRIGGER reject_event BEFORE INSERT ON task_events BEGIN SELECT RAISE(ABORT,'test interruption'); END;").unwrap();
        assert!(store.save_task("A task").is_err());
        assert!(store.workspace().unwrap().tasks.is_empty());
    }
    #[test]
    fn rejects_empty_oversize_and_future_schema() {
        let mut store = Store::open(":memory:").unwrap();
        assert!(store.save_task(" \n ").is_err());
        assert!(store.save_task(&"x".repeat(2001)).is_err());
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("future.sqlite");
        Connection::open(&path)
            .unwrap()
            .execute_batch("PRAGMA user_version=4;")
            .unwrap();
        assert!(Store::open(path).is_err());
    }
}
