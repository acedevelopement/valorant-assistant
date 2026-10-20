use crate::audit;
use once_cell::sync::Lazy;
use serde::Serialize;
use std::sync::{Mutex, MutexGuard};
use std::time::{Duration, Instant};

const ADMIN_USERNAME: &str = "mahad771";
const ADMIN_HASH: &str = "$2b$12$kCcgoFAzoj8Ya/aSCHX.Te62J26Ynpom.Ohajifv31h9lQXNK4PyK";

const MAX_FAILS: u32 = 5;
const LOCK_SECS: u64 = 300;

// Session lives in memory only - cleared on app restart.
static SESSION: Lazy<Mutex<bool>> = Lazy::new(|| Mutex::new(false));

struct Throttle {
    fails: u32,
    locked_until: Option<Instant>,
}
static THROTTLE: Lazy<Mutex<Throttle>> = Lazy::new(|| {
    Mutex::new(Throttle {
        fails: 0,
        locked_until: None,
    })
});

fn lock<T>(m: &Mutex<T>) -> MutexGuard<'_, T> {
    m.lock().unwrap_or_else(|e| e.into_inner())
}

#[derive(Serialize)]
pub struct LoginResult {
    pub success: bool,
    pub message: String,
}

fn fail(msg: &str) -> LoginResult {
    LoginResult {
        success: false,
        message: msg.to_string(),
    }
}

#[tauri::command]
pub fn admin_login(username: String, password: String) -> LoginResult {
    // 1) Locked out? (not audited per-attempt, to avoid webhook spam)
    {
        let t = lock(&THROTTLE);
        if let Some(until) = t.locked_until {
            let now = Instant::now();
            if until > now {
                let left = (until - now).as_secs() + 1;
                return fail(&format!("Too many attempts. Try again in {}s.", left));
            }
        }
    }

    // 2) Check credentials
    let user_ok = username == ADMIN_USERNAME;
    let pass_ok = user_ok && bcrypt::verify(&password, ADMIN_HASH).unwrap_or(false);

    if pass_ok {
        {
            let mut t = lock(&THROTTLE);
            t.fails = 0;
            t.locked_until = None;
        }
        *lock(&SESSION) = true;
        audit::record(
            "\u{1F513} Admin login SUCCESS",
            audit::GREEN,
            vec![("Username", username)],
        );
        return LoginResult {
            success: true,
            message: "Signed in.".to_string(),
        };
    }

    // 3) Failure bookkeeping
    let locked_now = {
        let mut t = lock(&THROTTLE);
        t.fails += 1;
        if t.fails >= MAX_FAILS {
            t.fails = 0;
            t.locked_until = Some(Instant::now() + Duration::from_secs(LOCK_SECS));
            true
        } else {
            false
        }
    };

    let attempted: String = username.chars().take(64).collect();
    let reason = (if user_ok { "Wrong password" } else { "Unknown username" }).to_string();

    if locked_now {
        audit::record(
            "\u{1F6A8} Admin LOCKED OUT (too many failed logins)",
            audit::RED,
            vec![
                ("Attempted username", attempted),
                ("Last failure", reason),
                ("Lock duration", format!("{} seconds", LOCK_SECS)),
            ],
        );
    } else {
        audit::record(
            "\u{26A0}\u{FE0F} Admin login FAILED",
            audit::YELLOW,
            vec![("Attempted username", attempted), ("Reason", reason)],
        );
    }

    fail("Invalid credentials.")
}

#[tauri::command]
pub fn admin_logout() {
    let was_logged_in = std::mem::replace(&mut *lock(&SESSION), false);
    if was_logged_in {
        audit::record("\u{1F512} Admin logout", audit::BLUE, vec![]);
    }
}

#[tauri::command]
pub fn admin_is_authenticated() -> bool {
    *lock(&SESSION)
}

// --- Local tournament storage ---

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct TournamentLink {
    pub label: String,
    pub url: String,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct LocalTournament {
    pub id: String,
    pub title: String,
    pub organizer: String,
    pub region: String,
    pub server: String,
    pub prize_pool: String,
    pub max_teams: u32,
    pub registration_opens: String,
    pub registration_closes: String,
    pub start_time: String,
    pub duration_hours: u32,
    pub description: String,
    pub links: Vec<TournamentLink>,
    pub banner_url: Option<String>,
}

fn tournaments_path() -> std::path::PathBuf {
    let mut p = dirs::data_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
    p.push("ValorantBuddy");
    let _ = std::fs::create_dir_all(&p);
    p.push("admin_tournaments.json");
    p
}

fn read_existing() -> Vec<LocalTournament> {
    std::fs::read_to_string(tournaments_path())
        .ok()
        .and_then(|t| serde_json::from_str(&t).ok())
        .unwrap_or_default()
}

fn diff_summary(old: &[LocalTournament], new: &[LocalTournament]) -> String {
    let mut lines: Vec<String> = vec![];
    for n in new {
        match old.iter().find(|o| o.id == n.id) {
            None => lines.push(format!("\u{2795} Added: {}", n.title)),
            Some(o) => {
                if serde_json::to_value(o).ok() != serde_json::to_value(n).ok() {
                    lines.push(format!("\u{270F}\u{FE0F} Edited: {}", n.title));
                }
            }
        }
    }
    for o in old {
        if !new.iter().any(|n| n.id == o.id) {
            lines.push(format!("\u{1F5D1}\u{FE0F} Removed: {}", o.title));
        }
    }
    if lines.is_empty() {
        "No changes".to_string()
    } else {
        lines.join("\n")
    }
}

#[tauri::command]
pub fn get_local_tournaments() -> Result<Vec<LocalTournament>, String> {
    let path = tournaments_path();
    if !path.exists() {
        return Ok(vec![]);
    }
    let text = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let list: Vec<LocalTournament> = serde_json::from_str(&text).unwrap_or_default();
    Ok(list)
}

#[tauri::command]
pub fn save_local_tournaments(tournaments: Vec<LocalTournament>) -> Result<(), String> {
    // Only allow when authenticated
    if !*lock(&SESSION) {
        audit::record(
            "\u{1F6AB} Unauthorized tournament save attempt",
            audit::RED,
            vec![("Entries submitted", tournaments.len().to_string())],
        );
        return Err("Not authenticated.".to_string());
    }

    let old = read_existing();
    let changes = diff_summary(&old, &tournaments);

    let path = tournaments_path();
    let text = serde_json::to_string_pretty(&tournaments).map_err(|e| e.to_string())?;

    match std::fs::write(&path, text) {
        Ok(_) => {
            audit::record(
                "\u{1F4DD} Tournaments saved",
                audit::BLUE,
                vec![
                    ("Total tournaments", tournaments.len().to_string()),
                    ("Changes", changes),
                ],
            );
            Ok(())
        }
        Err(e) => {
            audit::record(
                "\u{274C} Tournament save FAILED",
                audit::RED,
                vec![("Error", e.to_string())],
            );
            Err(e.to_string())
        }
    }
}
