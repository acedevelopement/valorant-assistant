use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use futures::future::join_all;
use tokio::time::sleep;

const HENRIK_KEY: &str = "HDEV-13616d75-6b79-4ee7-9574-743cbd68487d";

const LIST_TTL: Duration = Duration::from_secs(1800); // 30 min
const RANK_TTL: Duration = Duration::from_secs(900); // 15 min
const SCOREBOARD_RANK_TTL: Duration = Duration::from_secs(86400); // 24 hrs

static MATCH_LIST_CACHE: Lazy<Mutex<HashMap<String, (Instant, Vec<PlayerMatch>)>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

static RANK_CACHE: Lazy<Mutex<HashMap<String, (Instant, PlayerRank)>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

static SCOREBOARD_RANK_CACHE: Lazy<Mutex<HashMap<String, (Instant, String)>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

static MATCH_DETAIL_CACHE: Lazy<Mutex<HashMap<String, MatchDetail>>> = Lazy::new(|| {
    let mut map = HashMap::new();
    if let Ok(text) = fs::read_to_string(detail_cache_path()) {
        if let Ok(loaded) = serde_json::from_str::<HashMap<String, MatchDetail>>(&text) {
            map = loaded;
        }
    }
    Mutex::new(map)
});

fn detail_cache_path() -> PathBuf {
    let mut p = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    p.push("ValorantBuddy");
    let _ = fs::create_dir_all(&p);
    p.push("match_details.json");
    p
}

fn save_detail_cache() {
    let cache = MATCH_DETAIL_CACHE.lock().unwrap();
    if let Ok(text) = serde_json::to_string(&*cache) {
        let _ = fs::write(detail_cache_path(), text);
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PlayerMatch {
    pub match_id: String,
    pub map: String,
    pub mode: String,
    pub agent: String,
    pub kills: u32,
    pub deaths: u32,
    pub assists: u32,
    pub score_ally: u32,
    pub score_enemy: u32,
    pub result: String,
    pub started_at: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MatchPlayer {
    pub name: String,
    pub tag: String,
    pub agent: String,
    pub team: String,
    pub kills: u32,
    pub deaths: u32,
    pub assists: u32,
    pub score: u32,
    pub is_subject: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RoundInfo {
    pub round_num: u32,
    pub winning_team: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MatchDetail {
    pub match_id: String,
    pub map: String,
    pub mode: String,
    pub rounds: Vec<RoundInfo>,
    pub players: Vec<MatchPlayer>,
    pub subject_team: String,
}

#[derive(Serialize, Clone, Debug)]
pub struct PlayerRank {
    pub rank: String,
    pub rr: Option<u32>,
    pub peak_rank: Option<String>,
}

fn parse_kyroskoh_rank(text: &str) -> String {
    if let Some(colon) = text.find(':') {
        let rank_part = text[colon + 1..].trim();
        if let Some(dash) = rank_part.find(" - ") {
            return rank_part[..dash].trim().to_string();
        }
        if let Some(dash) = rank_part.find(": ") {
            return rank_part[..dash].trim().to_string();
        }
    }
    "Unranked".to_string()
}

fn first_str(v: &serde_json::Value, paths: &[&[&str]]) -> String {
    for path in paths {
        let mut cur = v;
        let mut ok = true;
        for key in *path {
            cur = &cur[*key];
            if cur.is_null() {
                ok = false;
                break;
            }
        }
        if ok {
            if let Some(s) = cur.as_str() {
                if !s.is_empty() {
                    return s.to_string();
                }
            }
        }
    }
    String::new()
}

fn first_u32(v: &serde_json::Value, paths: &[&[&str]]) -> u32 {
    for path in paths {
        let mut cur = v;
        let mut ok = true;
        for key in *path {
            cur = &cur[*key];
            if cur.is_null() {
                ok = false;
                break;
            }
        }
        if ok {
            if let Some(n) = cur.as_u64() {
                return n as u32;
            }
        }
    }
    0
}

#[tauri::command]
pub async fn get_player_rank(
    region: String,
    name: String,
    tag: String,
) -> Result<PlayerRank, String> {
    let key = format!("{}:{}:{}", region, name, tag);

    {
        let cache = RANK_CACHE.lock().unwrap();
        if let Some((ts, rank)) = cache.get(&key) {
            if ts.elapsed() < RANK_TTL {
                return Ok(rank.clone());
            }
        }
    }

    let url = format!(
        "https://api.henrikdev.xyz/valorant/v2/mmr/{}/{}/{}",
        region, name, tag
    );

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| format!("client error: {}", e))?;

    let res = client
        .get(&url)
        .header("Authorization", HENRIK_KEY)
        .send()
        .await
        .map_err(|e| format!("request failed: {}", e))?;

    let status = res.status();

    if status.as_u16() == 429 {
        return Err("Henrik API rate limit hit. Wait 60 seconds and try again.".to_string());
    }

    let text = res.text().await.map_err(|e| format!("read failed: {}", e))?;

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

    let result = PlayerRank {
        rank,
        rr,
        peak_rank,
    };

    {
        let mut cache = RANK_CACHE.lock().unwrap();
        cache.insert(key, (Instant::now(), result.clone()));
    }

    Ok(result)
}

#[tauri::command]
pub async fn get_player_matches(
    region: String,
    name: String,
    tag: String,
    size: u32,
    mode: Option<String>,
) -> Result<Vec<PlayerMatch>, String> {
    let cache_key = format!(
        "{}:{}:{}:{}:{}",
        region,
        name,
        tag,
        size,
        mode.clone().unwrap_or_default()
    );

    {
        let cache = MATCH_LIST_CACHE.lock().unwrap();
        if let Some((ts, data)) = cache.get(&cache_key) {
            if ts.elapsed() < LIST_TTL {
                return Ok(data.clone());
            }
        }
    }

    let mut url = format!(
        "https://api.henrikdev.xyz/valorant/v3/matches/{}/{}/{}?size={}",
        region, name, tag, size
    );

    if let Some(m) = &mode {
        if !m.is_empty() {
            url.push_str(&format!("&mode={}", m));
        }
    }

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| format!("client error: {}", e))?;

    let res = client
        .get(&url)
        .header("Authorization", HENRIK_KEY)
        .send()
        .await
        .map_err(|e| format!("request failed: {}", e))?;

    let status = res.status();

    if status.as_u16() == 429 {
        return Err("Henrik API rate limit hit. Wait 60 seconds and try again.".to_string());
    }

    let text = res.text().await.map_err(|e| format!("read failed: {}", e))?;

    if !status.is_success() {
        return Err(format!("API {}: {}", status, text.trim()));
    }

    let json: serde_json::Value =
        serde_json::from_str(&text).map_err(|e| format!("JSON parse failed: {}", e))?;

    let arr = json["data"].as_array().ok_or("no data array in response")?;

    let mut out: Vec<PlayerMatch> = vec![];

    for m in arr {
        let match_id = first_str(m, &[&["metadata", "matchid"], &["metadata", "match_id"]]);
        let map = first_str(m, &[&["metadata", "map"], &["metadata", "mapName"]]);
        let mode = first_str(m, &[&["metadata", "mode"], &["metadata", "queue"]]);
        let started_at = first_u32(
            m,
            &[&["metadata", "game_start"], &["metadata", "gameStart"]],
        ) as u64;

        let players = m["players"]["all_players"]
            .as_array()
            .or_else(|| m["players"]["allPlayers"].as_array());

        let mut found_agent = String::new();
        let mut kills = 0;
        let mut deaths = 0;
        let mut assists = 0;
        let mut result = String::new();

        if let Some(plist) = players {
            for p in plist {
                let pname = first_str(p, &[&["name"], &["gameName"]]);
                let ptag = first_str(p, &[&["tag"], &["tagLine"]]);
                if pname.to_lowercase() == name.to_lowercase()
                    && ptag.to_lowercase() == tag.to_lowercase()
                {
                    found_agent = first_str(p, &[&["agent", "name"], &["character"]]);
                    kills = first_u32(p, &[&["stats", "kills"]]);
                    deaths = first_u32(p, &[&["stats", "deaths"]]);
                    assists = first_u32(p, &[&["stats", "assists"]]);
                    result = first_str(p, &[&["stats", "result"]]);
                }
            }
        }

        let red_score = first_u32(
            m,
            &[
                &["teams", "red", "rounds_won"],
                &["teams", "red", "roundsWon"],
            ],
        );
        let blue_score = first_u32(
            m,
            &[
                &["teams", "blue", "rounds_won"],
                &["teams", "blue", "roundsWon"],
            ],
        );

        let (score_ally, score_enemy) = if result.to_lowercase() == "red" {
            (red_score, blue_score)
        } else {
            (blue_score, red_score)
        };

        out.push(PlayerMatch {
            match_id,
            map,
            mode,
            agent: found_agent,
            kills,
            deaths,
            assists,
            score_ally,
            score_enemy,
            result,
            started_at,
        });
    }

    {
        let mut cache = MATCH_LIST_CACHE.lock().unwrap();
        cache.insert(cache_key, (Instant::now(), out.clone()));
    }

    Ok(out)
}

#[tauri::command]
pub async fn get_match_detail(
    region: String,
    match_id: String,
    subject_name: String,
    subject_tag: String,
) -> Result<MatchDetail, String> {
    let _ = region;

    let cache_key = format!("{}:{}:{}", match_id, subject_name, subject_tag);

    {
        let cache = MATCH_DETAIL_CACHE.lock().unwrap();
        if let Some(detail) = cache.get(&cache_key) {
            return Ok(detail.clone());
        }
    }

    let url = format!("https://api.henrikdev.xyz/valorant/v2/match/{}", match_id);

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| format!("client error: {}", e))?;

    let res = client
        .get(&url)
        .header("Authorization", HENRIK_KEY)
        .send()
        .await
        .map_err(|e| format!("request failed: {}", e))?;

    let status = res.status();

    if status.as_u16() == 429 {
        return Err("Henrik API rate limit hit. Wait 60 seconds and try again.".to_string());
    }

    let text = res.text().await.map_err(|e| format!("read failed: {}", e))?;

    if !status.is_success() {
        return Err(format!("API {}: {}", status, text.trim()));
    }

    let json: serde_json::Value =
        serde_json::from_str(&text).map_err(|e| format!("JSON parse failed: {}", e))?;

    let data = &json["data"];
    let map = first_str(data, &[&["metadata", "map"], &["metadata", "mapName"]]);
    let mode = first_str(data, &[&["metadata", "mode"], &["metadata", "queue"]]);

    let mut players: Vec<MatchPlayer> = vec![];
    let mut subject_team = String::new();

    if let Some(arr) = data["players"]["all_players"]
        .as_array()
        .or_else(|| data["players"]["allPlayers"].as_array())
    {
        for p in arr {
            let pname = first_str(p, &[&["name"], &["gameName"]]);
            let ptag = first_str(p, &[&["tag"], &["tagLine"]]);
            let team = first_str(p, &[&["team"], &["teamId"]]);
            let agent = first_str(p, &[&["agent", "name"], &["character"]]);
            let kills = first_u32(p, &[&["stats", "kills"]]);
            let deaths = first_u32(p, &[&["stats", "deaths"]]);
            let assists = first_u32(p, &[&["stats", "assists"]]);
            let score = first_u32(p, &[&["stats", "score"]]);

            let is_subject = pname.to_lowercase() == subject_name.to_lowercase()
                && ptag.to_lowercase() == subject_tag.to_lowercase();

            if is_subject {
                subject_team = team.clone();
            }

            players.push(MatchPlayer {
                name: pname,
                tag: ptag,
                agent,
                team,
                kills,
                deaths,
                assists,
                score,
                is_subject,
            });
        }
    }

    let mut rounds: Vec<RoundInfo> = vec![];
    if let Some(arr) = data["rounds"].as_array() {
        for (i, r) in arr.iter().enumerate() {
            let winning_team = first_str(r, &[&["winning_team"], &["winningTeam"]]);
            rounds.push(RoundInfo {
                round_num: (i as u32) + 1,
                winning_team,
            });
        }
    }

    let result = MatchDetail {
        match_id,
        map,
        mode,
        rounds,
        players,
        subject_team,
    };

    {
        let mut cache = MATCH_DETAIL_CACHE.lock().unwrap();
        cache.insert(cache_key, result.clone());
    }
    save_detail_cache();

    Ok(result)
}

#[tauri::command]
pub async fn get_match_ranks(
    region: String,
    players: Vec<String>,
) -> Result<HashMap<String, String>, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let mut rank_map = HashMap::new();
    let mut fetch_needed = vec![];

    // 1. Check cache first
    {
        let cache = SCOREBOARD_RANK_CACHE.lock().unwrap();
        for pt in players {
            if let Some((ts, rank)) = cache.get(&pt) {
                if ts.elapsed() < SCOREBOARD_RANK_TTL {
                    rank_map.insert(pt.clone(), rank.clone());
                    continue;
                }
            }
            fetch_needed.push(pt);
        }
    }

    if fetch_needed.is_empty() {
        return Ok(rank_map);
    }

    // 2. Fetch missing ones with a 300ms delay between each to avoid rate limits
    let mut futs = vec![];
    for (i, pt) in fetch_needed.into_iter().enumerate() {
        let client = client.clone();
        let region = region.clone();
        
        futs.push(async move {
            sleep(Duration::from_millis(300 * i as u64)).await;
            
            let parts: Vec<&str> = pt.split('#').collect();
            if parts.len() != 2 {
                return (pt, "Invalid".to_string());
            }
            let (name, tag) = (parts[0], parts[1]);

            let url = format!(
                "https://api.kyroskoh.xyz/valorant/v1/mmr/{}/{}/{}?show=combo&display=1",
                region, name, tag
            );

            match client.get(&url).send().await {
                Ok(res) => {
                    if let Ok(text) = res.text().await {
                        let rank = parse_kyroskoh_rank(&text);
                        (pt, rank)
                    } else {
                        (pt, "Unknown".to_string())
                    }
                }
                Err(_) => (pt, "Error".to_string()),
            }
        });
    }

    let results = join_all(futs).await;

    // 3. Save new results to cache
    {
        let mut cache = SCOREBOARD_RANK_CACHE.lock().unwrap();
        for (pt, rank) in results {
            cache.insert(pt.clone(), (Instant::now(), rank.clone()));
            rank_map.insert(pt, rank);
        }
    }

    Ok(rank_map)
}
