use base64::{engine::general_purpose::STANDARD, Engine as _};
use serde::Serialize;
use std::path::PathBuf;

#[derive(Serialize, Clone, Debug)]
pub struct MatchSummary {
    pub match_id: String,
    pub map: String,
    pub agent: String,
    pub result: String,
    pub kills: u32,
    pub deaths: u32,
    pub assists: u32,
    pub acs: u32,
    pub score_ally: u32,
    pub score_enemy: u32,
    pub queue: String,
    pub started_at: u64,
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

async fn get_puuid(port: u16, auth: &str) -> Result<String, String> {
    let url = format!("https://127.0.0.1:{}/chat/v1/session", port);
    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .timeout(std::time::Duration::from_secs(3))
        .build()
        .map_err(|e| e.to_string())?;

    let res = client
        .get(&url)
        .header("Authorization", auth)
        .send()
        .await
        .map_err(|e| format!("session request failed: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("session status {}", res.status()));
    }

    let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    json["puuid"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "no puuid in session".to_string())
}

#[tauri::command]
pub async fn get_matches(count: u32) -> Result<Vec<MatchSummary>, String> {
    let (port, password) = read_lockfile()?;

    let auth_raw = format!("riot:{}", password);
    let auth_encoded = STANDARD.encode(auth_raw.as_bytes());
    let auth_header = format!("Basic {}", auth_encoded);

    let puuid = get_puuid(port, &auth_header).await?;

    let url = format!(
        "https://127.0.0.1:{}/match-history/v1/history/{}?startIndex=0&endIndex={}",
        port, puuid, count
    );

    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;

    let res = client
        .get(&url)
        .header("Authorization", &auth_header)
        .send()
        .await
        .map_err(|e| format!("match-history request failed: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("match-history status {}", res.status()));
    }

    let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    let history = json["History"]
        .as_array()
        .ok_or("no History array in response")?;

    let mut out: Vec<MatchSummary> = vec![];

    for h in history {
        let match_id = h["MatchID"].as_str().unwrap_or("").to_string();
        if match_id.is_empty() {
            continue;
        }

        let map = h["MapID"]
            .as_str()
            .unwrap_or("")
            .rsplit('/')
            .next()
            .unwrap_or("")
            .to_string();

        let queue = h["QueueID"].as_str().unwrap_or("").to_string();

        let started_at = h["GameStartTime"].as_u64().unwrap_or(0);

        // Stats may or may not exist depending on the match state.
        // Competitive/Unrated include a Stats block; some others don't.
        let stats = &h["Stats"];
        let kills = stats["Kills"].as_u64().unwrap_or(0) as u32;
        let deaths = stats["Deaths"].as_u64().unwrap_or(0) as u32;
        let assists = stats["Assists"].as_u64().unwrap_or(0) as u32;
        let acs = stats["Score"].as_u64().unwrap_or(0) as u32;

        let score_ally = stats["TeamScore"].as_u64().unwrap_or(0) as u32;
        let score_enemy = stats["EnemyScore"].as_u64().unwrap_or(0) as u32;

        let result = if score_ally > score_enemy {
            "win".to_string()
        } else if score_enemy > score_ally {
            "loss".to_string()
        } else {
            "draw".to_string()
        };

        // Agent isn't in the summary — the API doesn't include it here.
        // We'd need a per-match call to get the agent. For now, leave blank.
        let agent = String::new();

        out.push(MatchSummary {
            match_id,
            map,
            agent,
            result,
            kills,
            deaths,
            assists,
            acs,
            score_ally,
            score_enemy,
            queue,
            started_at,
        });
    }

    Ok(out)
}
