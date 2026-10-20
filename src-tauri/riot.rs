use base64::{engine::general_purpose::STANDARD, Engine as _};
use serde::Serialize;
use std::path::PathBuf;

#[derive(Serialize)]
pub struct RiotSession {
    pub puuid: String,
    pub game_name: String,
    pub tag_line: String,
}

#[derive(Serialize)]
pub struct LockfileInfo {
    pub port: u16,
    pub password: String,
}

/// Read and parse the Riot Client lockfile
fn read_lockfile() -> Result<LockfileInfo, String> {
    // Riot Client lockfile path on Windows
    let local_app_data = std::env::var("LOCALAPPDATA")
        .map_err(|_| "Could not find LOCALAPPDATA env var".to_string())?;
    
    let lockfile_path = PathBuf::from(local_app_data)
        .join("Riot Games")
        .join("Riot Client")
        .join("Config")
        .join("lockfile");

    let content = std::fs::read_to_string(&lockfile_path)
        .map_err(|e| format!("Could not read lockfile at {:?}: {}", lockfile_path, e))?;

    let parts: Vec<&str> = content.trim().split(':').collect();
    
    // Riot Client format: RiotClientUx:port:password:protocol:pid
    // We need at least 4 parts
    if parts.len() < 4 {
        return Err(format!("Invalid lockfile format: {}", content));
    }

    let port: u16 = parts[1]
        .parse()
        .map_err(|_| format!("Invalid port: {}", parts[1]))?;
    
    let password = parts[2].to_string();

    Ok(LockfileInfo { port, password })
}

/// Fetch the current session info (name, tag, PUUID) from the local client
#[tauri::command]
pub async fn get_riot_session() -> Result<RiotSession, String> {
    let info = read_lockfile()?;

    // Build the auth header: Basic base64("riot:PASSWORD")
    let auth_raw = format!("riot:{}", info.password);
    let auth_encoded = STANDARD.encode(auth_raw.as_bytes());
    let auth_header = format!("Basic {}", auth_encoded);

    let url = format!("https://127.0.0.1:{}/chat/v1/session", info.port);

    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true) // Local API uses self-signed cert
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let response = client
        .get(&url)
        .header("Authorization", auth_header)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API returned status: {}", response.status()));
    }

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    let game_name = json["game_name"]
        .as_str()
        .unwrap_or("Unknown")
        .to_string();
    let tag_line = json["game_tag"]
        .as_str()
        .unwrap_or("Unknown")
        .to_string();
    let puuid = json["puuid"]
        .as_str()
        .unwrap_or("Unknown")
        .to_string();

    Ok(RiotSession {
        puuid,
        game_name,
        tag_line,
    })
}