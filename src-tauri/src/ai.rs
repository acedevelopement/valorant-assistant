use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Serialize)]
pub struct ChatResponse {
    pub content: String,
}

const GEMINI_API_KEY: &str = ""; // Key removed for security. Provide via .env or manual input.
const GEMINI_MODEL: &str = "gemini-3.5-flash";

#[tauri::command]
pub async fn ai_chat(messages: Vec<ChatMessage>) -> Result<ChatResponse, String> {
    if GEMINI_API_KEY.starts_with("PASTE_") {
        return Err(
            "Gemini API key not configured. Open src-tauri/src/ai.rs and paste your key.".into(),
        );
    }

    // Split system prompt from the rest
    let system_prompt = messages
        .iter()
        .find(|m| m.role == "system")
        .map(|m| m.content.clone())
        .unwrap_or_default();

    let contents: Vec<serde_json::Value> = messages
        .iter()
        .filter(|m| m.role != "system")
        .map(|m| {
            serde_json::json!({
                "role": if m.role == "user" { "user" } else { "model" },
                "parts": [{ "text": m.content }]
            })
        })
        .collect();

    let mut body = serde_json::json!({ "contents": contents });
    if !system_prompt.is_empty() {
        body["systemInstruction"] = serde_json::json!({ "parts": [{ "text": system_prompt }] });
    }

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent",
        GEMINI_MODEL
    );

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| format!("client build failed: {}", e))?;

    let res = client
        .post(&url)
        .header("x-goog-api-key", GEMINI_API_KEY)
        .header("Content-Type", "application/json")
        .json(&body)
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

    let content = json["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .unwrap_or("")
        .to_string();

    if content.is_empty() {
        return Err(format!("Empty response from Gemini: {}", text.trim()));
    }

    Ok(ChatResponse { content })
}
