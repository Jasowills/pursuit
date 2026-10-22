use crate::Store;
use rusqlite::{params, Result};
impl Store {
    pub fn career_book(&self) -> Result<Option<String>> {
        let mut q = self
            .connection
            .prepare("SELECT body FROM career_book WHERE id=1")?;
        let mut rows = q.query([])?;
        rows.next()?.map(|r| r.get(0)).transpose()
    }
    pub fn save_career_book(&mut self, body: &str) -> Result<()> {
        if body.len() > 524288 {
            return Err(rusqlite::Error::InvalidQuery);
        }
        let value: serde_json::Value =
            serde_json::from_str(body).map_err(|_| rusqlite::Error::InvalidQuery)?;
        if value.get("version").and_then(|v| v.as_u64()) != Some(1) {
            return Err(rusqlite::Error::InvalidQuery);
        }
        for key in ["messages", "opportunities", "notes"] {
            if !value
                .get(key)
                .is_some_and(|v| v.is_array() && v.as_array().unwrap().len() <= 2000)
            {
                return Err(rusqlite::Error::InvalidQuery);
            }
        }
        for job in value["opportunities"].as_array().unwrap() {
            if ![
                "id", "company", "role", "location", "salary", "reason", "posting", "status",
            ]
            .iter()
            .all(|key| job.get(key).is_some_and(|v| v.is_string()))
            {
                return Err(rusqlite::Error::InvalidQuery);
            }
            let status = job["status"].as_str().unwrap();
            if !["Review", "Prepared", "Applied", "Video needed"].contains(&status) {
                return Err(rusqlite::Error::InvalidQuery);
            }
            if status == "Applied"
                && job
                    .get("confirmation")
                    .and_then(|v| v.as_str())
                    .is_none_or(|s| s.trim().is_empty())
            {
                return Err(rusqlite::Error::InvalidQuery);
            }
        }
        for message in value["messages"].as_array().unwrap() {
            if !message.get("text").is_some_and(|v| v.is_string())
                || !message
                    .get("role")
                    .and_then(|v| v.as_str())
                    .is_some_and(|s| ["user", "assistant"].contains(&s))
            {
                return Err(rusqlite::Error::InvalidQuery);
            }
        }
        self.connection.execute("INSERT INTO career_book(id,body) VALUES(1,?1) ON CONFLICT(id) DO UPDATE SET body=excluded.body",params![body])?;
        Ok(())
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn career_record_survives_restart_and_rejects_false_submission() {
        let p = std::env::temp_dir().join(format!("pursuit-book-{}.sqlite", uuid::Uuid::new_v4()));
        let body = r#"{"version":1,"messages":[{"id":"1","role":"user","text":"Review this role"}],"opportunities":[{"id":"job-1","company":"Example","role":"Designer","location":"Remote","salary":"Not specified","reason":"Manual intake","posting":"Design tools","status":"Review"}],"notes":[]}"#;
        {
            let mut s = Store::open(&p).unwrap();
            assert!(s.career_book().unwrap().is_none());
            s.save_career_book(body).unwrap();
            assert!(s
                .save_career_book(&body.replace("\"status\":\"Review\"", "\"status\":\"Applied\""))
                .is_err());
            assert!(s.save_career_book("{}").is_err());
        }
        {
            let s = Store::open(&p).unwrap();
            assert_eq!(s.career_book().unwrap().unwrap(), body);
            assert_eq!(s.workspace().unwrap().schema_version, 4);
        }
        let _ = std::fs::remove_file(p);
    }
}
