use base64::{engine::general_purpose::STANDARD, Engine as _};
use serde::Serialize;
use std::path::PathBuf;

const HENRIK_KEY: &str = "HDEV-13616d75-6b79-4ee7-9574-743cbd68487d";

#[derive(Serialize, Clone, Debug, Default)]
pub struct RiotSession {
    pub logged_in: bool,
    pub puuid: String,
    pub game_name: String,
    pub tag_line: String,
    pub region: String,
}

#[derive(Serialize, Clone, Debug, Default)]
pub struct RankInfo {
    pub rank: String,
    pub rr: Option<u32>,
    pub peak_rank: Option<String>,
}

fn read_lockfile() -> Result<(u16, String), String> {
    let local_app_data =
        std::env::var("LOCALAPPDATA").map_err(|_| "LOCALAPPDATA not set".to_string())?;

    let path = PathBuf::from(local_app_data)
        .join("Riot Games")
        .join("Riot Client")
        .join("Config")
        .join("lockfile");

    let content =
        std::fs::read_to_string(&path).map_err(|e| format!("lockfile read failed: {}", e))?;

    let parts: Vec<&str> = content.trim().split(':').collect();
    if parts.len() < 4 {
        return Err("Invalid lockfile format".to_string());
    }

    let port: u16 = parts[1].parse().map_err(|_| "Bad port".to_string())?;
    let password = parts[2].to_string();
    Ok((port, password))
}

fn build_auth_header(password: &str) -> String {
    let raw = format!("riot:{}", password);
    format!("Basic {}", STANDARD.encode(raw.as_bytes()))
}

async fn try_session_endpoint(
    client: &reqwest::Client,
    port: u16,
    auth: &str,
) -> Option<RiotSession> {
    let url = format!("https://127.0.0.1:{}/chat/v4/session", port);
    let res = client
        .get(&url)
        .header("Authorization", auth)
        .send()
        .await
        .ok()?;

    if !res.status().is_success() {
        return None;
    }

    let json: serde_json::Value = res.json().await.ok()?;

    let game_name = json["game_name"].as_str().unwrap_or("").to_string();
    let tag_line = json["game_tag"].as_str().unwrap_or("").to_string();
    let puuid = json["puuid"].as_str().unwrap_or("").to_string();
    let region = json["region"].as_str().unwrap_or("").to_string();

    if puuid.is_empty() {
        return None;
    }

    Some(RiotSession {
        logged_in: true,
        puuid,
        game_name,
        tag_line,
        region,
    })
}

async fn try_presence_endpoint(
    client: &reqwest::Client,
    port: u16,
    auth: &str,
) -> Option<RiotSession> {
    let url = format!("https://127.0.0.1:{}/chat/v4/presences", port);
    let res = client
        .get(&url)
        .header("Authorization", auth)
        .send()
        .await
        .ok()?;

    if !res.status().is_success() {
        return None;
    }

    let json: serde_json::Value = res.json().await.ok()?;
    let presences = json["presences"].as_array()?;

    for p in presences {
        let product = p["product"].as_str().unwrap_or("");
        if product != "valorant" && product != "riot_client" {
            continue;
        }

        let puuid = p["puuid"].as_str().unwrap_or("").to_string();
        if puuid.is_empty() {
            continue;
        }

        let game_name = p["game_name"].as_str().unwrap_or("").to_string();
        let tag_line = p["game_tag"].as_str().unwrap_or("").to_string();
        let region = p["region"].as_str().unwrap_or("").to_string();

        if game_name.is_empty() {
            continue;
        }

        return Some(RiotSession {
            logged_in: true,
            puuid,
            game_name,
            tag_line,
            region,
        });
    }

    None
}

#[tauri::command]
pub async fn get_riot_session() -> Result<RiotSession, String> {
    let (port, password) = match read_lockfile() {
        Ok(v) => v,
        Err(_) => return Ok(RiotSession::default()),
    };

    let auth = build_auth_header(&password);

    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .timeout(std::time::Duration::from_secs(3))
        .build()
        .map_err(|e| format!("client build failed: {}", e))?;

    if let Some(session) = try_session_endpoint(&client, port, &auth).await {
        return Ok(session);
    }

    if let Some(session) = try_presence_endpoint(&client, port, &auth).await {
        return Ok(session);
    }

    Ok(RiotSession::default())
}

#[tauri::command]
pub async fn get_rank(region: String, name: String, tag: String) -> Result<RankInfo, String> {
    let url = format!(
        "https://api.henrikdev.xyz/valorant/v2/mmr/{}/{}/{}",
        region, name, tag
    );

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("client error: {}", e))?;

    let res = client
        .get(&url)
        .header("Authorization", HENRIK_KEY)
        .send()
        .await
        .map_err(|e| format!("request failed: {}", e))?;

    let status = res.status();
    let text = res
        .text()
        .await
        .map_err(|e| format!("read failed: {}", e))?;

    if !status.is_success() {
        return Err(format!("API {}: {}", status, text.trim()));
    }

    let json: serde_json::Value =
        serde_json::from_str(&text).map_err(|e| format!("JSON parse failed: {}", e))?;

    let data = &json["data"];

    let rank = data["current_data"]["currenttierpatched"]
        .as_str()
        .unwrap_or("Unranked")
        .to_string();

    let rr = data["current_data"]["ranking_in_tier"]
        .as_u64()
        .map(|v| v as u32);

    let peak_rank = data["highest_rank"]["patched_tier"]
        .as_str()
        .map(|s| s.to_string());

    Ok(RankInfo {
        rank,
        rr,
        peak_rank,
    })
}
