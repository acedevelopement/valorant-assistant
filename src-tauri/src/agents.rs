use once_cell::sync::Lazy;
use serde::Serialize;
use std::sync::Mutex;

#[derive(Serialize, Clone, Debug)]
pub struct Agent {
    pub uuid: String,
    pub display_name: String,
    pub description: String,
    pub role: String,
    pub role_icon: String,
    pub display_icon: String,
    pub full_portrait: String,
    pub abilities: Vec<Ability>,
}

#[derive(Serialize, Clone, Debug)]
pub struct Ability {
    pub slot: String,
    pub display_name: String,
    pub description: String,
    pub display_icon: String,
}

// Cache agents forever — they change maybe 3x per year.
static AGENTS_CACHE: Lazy<Mutex<Option<Vec<Agent>>>> = Lazy::new(|| Mutex::new(None));

#[tauri::command]
pub async fn get_agents() -> Result<Vec<Agent>, String> {
    // Serve from cache if we have it
    {
        let cache = AGENTS_CACHE.lock().unwrap();
        if let Some(agents) = cache.as_ref() {
            return Ok(agents.clone());
        }
    }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;

    let res = client
        .get("https://valorant-api.com/v1/agents?isPlayableCharacter=true")
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let json: serde_json::Value = res
        .json()
        .await
        .map_err(|e| format!("JSON parse failed: {}", e))?;

    let arr = json["data"].as_array().ok_or("No data array")?;

    let mut agents = vec![];

    for a in arr {
        let abilities = a["abilities"]
            .as_array()
            .map(|abs| {
                abs.iter()
                    .map(|ab| Ability {
                        slot: ab["slot"].as_str().unwrap_or("").to_string(),
                        display_name: ab["displayName"].as_str().unwrap_or("").to_string(),
                        description: ab["description"].as_str().unwrap_or("").to_string(),
                        display_icon: ab["displayIcon"].as_str().unwrap_or("").to_string(),
                    })
                    .collect()
            })
            .unwrap_or_default();

        agents.push(Agent {
            uuid: a["uuid"].as_str().unwrap_or("").to_string(),
            display_name: a["displayName"].as_str().unwrap_or("").to_string(),
            description: a["description"].as_str().unwrap_or("").to_string(),
            role: a["role"]["displayName"].as_str().unwrap_or("").to_string(),
            role_icon: a["role"]["displayIcon"].as_str().unwrap_or("").to_string(),
            display_icon: a["displayIcon"].as_str().unwrap_or("").to_string(),
            full_portrait: a["fullPortrait"].as_str().unwrap_or("").to_string(),
            abilities,
        });
    }

    {
        let mut cache = AGENTS_CACHE.lock().unwrap();
        *cache = Some(agents.clone());
    }

    Ok(agents)
}
