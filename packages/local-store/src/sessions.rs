use crate::Store;
use rusqlite::{params, Result};
use serde::Serialize;
#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SessionRecord {
    pub id: String,
    pub title: String,
    pub provider: String,
    pub model: String,
    pub state: String,
    pub snapshot: String,
    pub created_at: String,
    pub updated_at: String,
}
impl Store {
    pub fn session_history(&self) -> Result<Vec<SessionRecord>> {
        let mut query=self.connection.prepare("SELECT id,title,provider,model,state,snapshot,created_at,updated_at FROM runtime_sessions ORDER BY updated_at DESC,rowid DESC LIMIT 100")?;
        let rows = query
            .query_map([], |r| {
                Ok(SessionRecord {
                    id: r.get(0)?,
                    title: r.get(1)?,
                    provider: r.get(2)?,
                    model: r.get(3)?,
                    state: r.get(4)?,
                    snapshot: r.get(5)?,
                    created_at: r.get(6)?,
                    updated_at: r.get(7)?,
                })
            })?
            .collect();
        rows
    }
    pub fn register_session(
        &mut self,
        id: &str,
        title: &str,
        provider: &str,
        model: &str,
    ) -> Result<()> {
        self.connection.execute(
            "INSERT INTO runtime_sessions(id,title,provider,model) VALUES(?1,?2,?3,?4)",
            params![id, title, provider, model],
        )?;
        Ok(())
    }
    pub fn snapshot_session(&mut self, id: &str, state: &str, snapshot: &str) -> Result<()> {
        let _: serde_json::Value =
            serde_json::from_str(snapshot).map_err(|_| rusqlite::Error::InvalidQuery)?;
        if ![
            "idle",
            "queued",
            "running",
            "completed",
            "failed",
            "interrupted",
            "unknown",
        ]
        .contains(&state)
        {
            return Err(rusqlite::Error::InvalidQuery);
        }
        let count=self.connection.execute("UPDATE runtime_sessions SET state=?2,snapshot=?3,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1 AND (state<>?2 OR snapshot<>?3)",params![id,state,snapshot])?;
        if count == 0
            && !self.connection.query_row(
                "SELECT EXISTS(SELECT 1 FROM runtime_sessions WHERE id=?1)",
                [id],
                |r| r.get::<_, bool>(0),
            )?
        {
            return Err(rusqlite::Error::QueryReturnedNoRows);
        }
        Ok(())
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn session_snapshot_survives_restart() {
        let d = tempfile::tempdir().unwrap();
        let p = d.path().join("workspace.sqlite");
        {
            let mut s = Store::open(&p).unwrap();
            s.register_session("ses_test", "A session", "openrouter", "org/model:tag")
                .unwrap();
            s.snapshot_session("ses_test", "queued", r#"[{"role":"user","text":"Hello"}]"#)
                .unwrap();
        }
        let s = Store::open(&p).unwrap();
        let h = s.session_history().unwrap();
        assert_eq!(h[0].model, "org/model:tag");
        assert_eq!(h[0].state, "queued");
        assert!(h[0].snapshot.contains("Hello"));
    }
    #[test]
    fn invalid_snapshot_does_not_replace_saved_history() {
        let mut s = Store::open(":memory:").unwrap();
        s.register_session("ses_test", "A session", "offline", "")
            .unwrap();
        assert!(s
            .snapshot_session("ses_test", "completed", "not-json")
            .is_err());
        assert!(s.snapshot_session("ses_test", "made-up", "[]").is_err());
        assert!(s.snapshot_session("ses_missing", "idle", "[]").is_err());
        assert_eq!(s.session_history().unwrap()[0].snapshot, "[]");
    }
}
