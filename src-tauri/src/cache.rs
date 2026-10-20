use std::fs;
use std::path::PathBuf;

fn cache_dir() -> PathBuf {
    let mut p = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    p.push("ValorantBuddy");
    p
}

#[tauri::command]
pub fn clear_cache() -> Result<String, String> {
    let dir = cache_dir();
    if !dir.exists() {
        return Ok("No cache to clear.".to_string());
    }

    let mut removed = 0u32;
    let mut bytes_freed = 0u64;

    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Ok(meta) = entry.metadata() {
                    bytes_freed += meta.len();
                }
                if fs::remove_file(&path).is_ok() {
                    removed += 1;
                }
            }
        }
    }

    let kb = bytes_freed / 1024;
    Ok(format!("Cleared {} file(s), freed {} KB.", removed, kb))
}

