use once_cell::sync::Lazy;
use serde_json::{json, Value};
use std::io::Write;
use std::path::PathBuf;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

pub const GREEN: u32 = 0x57F287;
pub const RED: u32 = 0xED4245;
pub const YELLOW: u32 = 0xFEE75C;
pub const BLUE: u32 = 0x5865F2;

// Set at BUILD time, so it never lives in source/git:
//   $env:VB_AUDIT_WEBHOOK = "https://discord.com/api/webhooks/..."
const WEBHOOK_URL: &str = match option_env!("VB_AUDIT_WEBHOOK") {
    Some(v) => v,
    None => "",
};

#[derive(Clone)]
struct MachineInfo {
    machine_guid: String,
    hostname: String,
    os_user: String,
    cpu: String,
    os: String,
}

static MACHINE: Lazy<MachineInfo> = Lazy::new(|| MachineInfo {
    machine_guid: read_machine_guid().unwrap_or_else(|| "unknown".to_string()),
    hostname: std::env::var("COMPUTERNAME").unwrap_or_else(|_| "unknown".to_string()),
    os_user: std::env::var("USERNAME").unwrap_or_else(|_| "unknown".to_string()),
    cpu: std::env::var("PROCESSOR_IDENTIFIER").unwrap_or_else(|_| "unknown".to_string()),
    os: format!("{} {}", std::env::consts::OS, std::env::consts::ARCH),
});

#[cfg(windows)]
fn read_machine_guid() -> Option<String> {
    use std::os::windows::process::CommandExt;
    use std::process::Command;
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    let out = Command::new("reg")
        .args([
            "query",
            r"HKLM\SOFTWARE\Microsoft\Cryptography",
            "/v",
            "MachineGuid",
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .ok()?;
    let text = String::from_utf8_lossy(&out.stdout).to_string();
    text.lines()
        .find(|l| l.contains("MachineGuid"))
        .and_then(|l| l.split_whitespace().last())
        .map(|s| s.to_string())
}

#[cfg(not(windows))]
fn read_machine_guid() -> Option<String> {
    None
}

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

// Unix seconds -> "YYYY-MM-DD HH:MM:SS UTC" (no extra crates needed)
fn utc_string(secs: u64) -> String {
    let days = (secs / 86400) as i64;
    let rem = secs % 86400;
    let (h, m, s) = (rem / 3600, (rem % 3600) / 60, rem % 60);
    let z = days + 719468;
    let era = z.div_euclid(146097);
    let doe = z.rem_euclid(146097);
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let mo = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if mo <= 2 { y + 1 } else { y };
    format!("{:04}-{:02}-{:02} {:02}:{:02}:{:02} UTC", y, mo, d, h, m, s)
}

async fn public_ip() -> String {
    let client = match reqwest::Client::builder()
        .timeout(Duration::from_secs(4))
        .build()
    {
        Ok(c) => c,
        Err(_) => return "unknown".to_string(),
    };
    match client.get("https://api.ipify.org").send().await {
        Ok(r) => r
            .text()
            .await
            .map(|t| t.trim().to_string())
            .unwrap_or_else(|_| "unknown".to_string()),
        Err(_) => "unknown".to_string(),
    }
}

fn field(name: &str, value: &str, inline: bool) -> Value {
    let v: String = value.chars().take(1000).collect();
    let v = if v.trim().is_empty() { "-".to_string() } else { v };
    json!({ "name": name, "value": v, "inline": inline })
}

fn log_path() -> PathBuf {
    let mut p = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    p.push("ValorantBuddy");
    let _ = std::fs::create_dir_all(&p);
    p.push("audit.log");
    p
}

fn append_local(entry: &Value) {
    if let Ok(mut f) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path())
    {
        let _ = writeln!(f, "{}", entry);
    }
}

/// Fire-and-forget: never blocks or fails the caller.
pub fn record(title: &str, color: u32, details: Vec<(&'static str, String)>) {
    let title = title.to_string();
    tauri::async_runtime::spawn(async move {
        let ts = now_secs();
        let machine = (*MACHINE).clone();
        let ip = public_ip().await;

        // ---- local audit.log (JSON lines) ----
        let mut dmap = serde_json::Map::new();
        for (n, v) in &details {
            dmap.insert((*n).to_string(), Value::String(v.clone()));
        }
        append_local(&json!({
            "ts": ts,
            "utc": utc_string(ts),
            "event": title,
            "details": dmap,
            "ip": ip,
            "hardware_id": machine.machine_guid,
            "hostname": machine.hostname,
            "os_user": machine.os_user,
            "cpu": machine.cpu,
            "os": machine.os,
            "app_version": env!("CARGO_PKG_VERSION"),
        }));

        // ---- Discord embed ----
        if WEBHOOK_URL.is_empty() {
            return;
        }

        let mut fields: Vec<Value> = Vec::new();
        for (n, v) in &details {
            fields.push(field(n, v, false));
        }
        fields.push(field(
            "Time",
            &format!("<t:{ts}:F>\n<t:{ts}:R>\n{}", utc_string(ts)),
            false,
        ));
        fields.push(field("IP address", &format!("`{}`", ip), true));
        fields.push(field("Hardware ID", &format!("`{}`", machine.machine_guid), true));
        fields.push(field("Device name", &machine.hostname, true));
        fields.push(field("Windows user", &machine.os_user, true));
        fields.push(field("OS", &machine.os, true));
        fields.push(field("App version", env!("CARGO_PKG_VERSION"), true));
        fields.push(field("CPU", &machine.cpu, false));

        let payload = json!({
            "username": "Valorant Buddy Audit",
            "allowed_mentions": { "parse": [] },
            "embeds": [{
                "title": title,
                "color": color,
                "fields": fields,
                "footer": { "text": "Valorant Buddy audit log" }
            }]
        });

        let client = match reqwest::Client::builder()
            .timeout(Duration::from_secs(10))
            .build()
        {
            Ok(c) => c,
            Err(_) => return,
        };
        if let Err(e) = client.post(WEBHOOK_URL).json(&payload).send().await {
            // without_url(): the error text would otherwise contain the webhook URL
            eprintln!("[audit] webhook failed: {}", e.without_url());
        }
    });
}
