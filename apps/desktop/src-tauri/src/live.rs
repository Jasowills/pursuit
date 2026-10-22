use serde_json::Value;
use std::collections::{BTreeMap, HashMap};
#[derive(Default)]
pub struct LiveText {
    pub message_id: String,
    pub parts: BTreeMap<u64, String>,
}
#[derive(Default)]
pub struct LiveCache(pub HashMap<String, LiveText>);
fn bounded(text: &str, bytes: usize) -> String {
    text.chars()
        .scan(0, |used, c| {
            *used += c.len_utf8();
            if *used <= bytes {
                Some(c)
            } else {
                None
            }
        })
        .collect()
}
impl LiveCache {
    pub fn apply(&mut self, event: &Value, clean: impl Fn(&str) -> String) {
        let kind = event["type"].as_str().unwrap_or("");
        if ![
            "session.text.started",
            "session.text.delta",
            "session.text.ended",
        ]
        .contains(&kind)
        {
            return;
        }
        let data = &event["data"];
        let Some(session) = data["sessionID"].as_str() else {
            return;
        };
        let Some(message) = data["assistantMessageID"].as_str() else {
            return;
        };
        let Some(ordinal) = data["ordinal"].as_u64() else {
            return;
        };
        if !session.starts_with("ses_")
            || session.len() > 100
            || !message.starts_with("msg_")
            || message.len() > 100
            || ordinal >= 16
        {
            return;
        }
        if !self.0.contains_key(session) && self.0.len() >= 50 {
            self.0.clear();
        }
        let entry = self.0.entry(session.into()).or_default();
        if entry.message_id != message {
            entry.message_id = message.into();
            entry.parts.clear();
        }
        if kind == "session.text.started" {
            entry.parts.insert(ordinal, String::new());
            return;
        }
        let field = if kind == "session.text.delta" {
            "delta"
        } else {
            "text"
        };
        let Some(text) = data[field].as_str() else {
            return;
        };
        let text = clean(text);
        if kind == "session.text.ended" {
            entry.parts.remove(&ordinal);
        }
        let remaining =
            64_000usize.saturating_sub(entry.parts.values().map(String::len).sum::<usize>());
        entry
            .parts
            .entry(ordinal)
            .or_default()
            .push_str(&bounded(&text, remaining));
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    #[test]
    fn deltas_and_ended_text_do_not_duplicate_and_ignore_other_events() {
        let mut c = LiveCache::default();
        for (kind, text) in [
            ("session.text.delta", "par"),
            ("session.text.delta", "tial"),
            ("session.text.ended", "partial"),
        ] {
            c.apply(&json!({"type":kind,"data":{"sessionID":"ses_x","assistantMessageID":"msg_x","ordinal":0,"delta":text,"text":text}}),str::to_owned);
        }
        assert_eq!(c.0["ses_x"].parts[&0], "partial");
        c.apply(
            &json!({"type":"integration.updated","data":{"key":"not forwarded"}}),
            str::to_owned,
        );
        assert_eq!(c.0.len(), 1);
    }
    #[test]
    fn streaming_text_is_bounded_and_redacted() {
        let mut c = LiveCache::default();
        c.apply(&json!({"type":"session.text.delta","data":{"sessionID":"ses_x","assistantMessageID":"msg_x","ordinal":0,"delta":"secret".repeat(20_000)}}),|s|s.replace("secret","[redacted]"));
        assert!(c.0["ses_x"].parts[&0].len() <= 64_000);
        assert!(!c.0["ses_x"].parts[&0].contains("secret"));
    }
}
