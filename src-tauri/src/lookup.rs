use serde::Serialize;

const HENRIK_KEY: &str = "HDEV-13616d75-6b79-4ee7-9574-743cbd68487d";

#[derive(Serialize)]
pub struct PlayerLookup {
    pub name: String,
    pub tag: String,
    pub region: String,
    pub rank: String,
    pub rr: Option<u32>,
    pub peak_rank: Option<String>,
}

#[tauri::command]
pub async fn lookup_player(
    region: String,
    name: String,
    tag: String,
) -> Result<PlayerLookup, String> {
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

    // Correct field paths based on Henrik's actual API response:
    // data.current_data.currenttierpatched -> "Gold 2"
    // data.current_data.ranking_in_tier    -> 59
    // data.highest_rank.patched_tier       -> "Gold 2"

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

    Ok(PlayerLookup {
        name: name.clone(),
        tag: tag.clone(),
        region: region.to_uppercase(),
        rank,
        rr,
        peak_rank,
    })
}
