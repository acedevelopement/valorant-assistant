use tauri::Manager;
use tauri_plugin_global_shortcut::{
    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
};

mod riot;
mod lookup;
mod agents;
mod matches;
mod ai;
mod player;
mod cache;
mod admin;
mod audit;

fn parse_hotkey(s: &str) -> Option<(Modifiers, Code)> {
    let parts: Vec<&str> = s.split('+').map(|p| p.trim()).collect();
    if parts.is_empty() {
        return None;
    }
    let mut mods = Modifiers::empty();
    let mut code: Option<Code> = None;
    for p in parts {
        match p.to_uppercase().as_str() {
            "CTRL" | "CONTROL" => mods |= Modifiers::CONTROL,
            "SHIFT" => mods |= Modifiers::SHIFT,
            "ALT" => mods |= Modifiers::ALT,
            "META" | "WIN" | "SUPER" => mods |= Modifiers::SUPER,
            "A" => code = Some(Code::KeyA),
            "B" => code = Some(Code::KeyB),
            "C" => code = Some(Code::KeyC),
            "D" => code = Some(Code::KeyD),
            "E" => code = Some(Code::KeyE),
            "F" => code = Some(Code::KeyF),
            "G" => code = Some(Code::KeyG),
            "H" => code = Some(Code::KeyH),
            "I" => code = Some(Code::KeyI),
            "J" => code = Some(Code::KeyJ),
            "K" => code = Some(Code::KeyK),
            "L" => code = Some(Code::KeyL),
            "M" => code = Some(Code::KeyM),
            "N" => code = Some(Code::KeyN),
            "O" => code = Some(Code::KeyO),
            "P" => code = Some(Code::KeyP),
            "Q" => code = Some(Code::KeyQ),
            "R" => code = Some(Code::KeyR),
            "S" => code = Some(Code::KeyS),
            "T" => code = Some(Code::KeyT),
            "U" => code = Some(Code::KeyU),
            "V" => code = Some(Code::KeyV),
            "W" => code = Some(Code::KeyW),
            "X" => code = Some(Code::KeyX),
            "Y" => code = Some(Code::KeyY),
            "Z" => code = Some(Code::KeyZ),
            _ => {}
        }
    }
    code.map(|c| (mods, c))
}

#[tauri::command]
fn register_hotkey(app: tauri::AppHandle, hotkey: String) -> Result<(), String> {
    let gs = app.global_shortcut();
    let _ = gs.unregister_all();
    let (mods, code) =
        parse_hotkey(&hotkey).ok_or_else(|| format!("Invalid hotkey: {}", hotkey))?;
    let shortcut = Shortcut::new(Some(mods), code);
    gs.register(shortcut)
        .map_err(|e| format!("Failed to register: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let default_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyB);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_drpc::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, _shortcut, event| {
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }
                    if let Some(window) = app.get_webview_window("main") {
                        let visible = window.is_visible().unwrap_or(true);
                        if visible {
                            let _ = window.hide();
                        } else {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(),
        )
        .setup(move |app| {
            app.global_shortcut()
                .register(default_shortcut)
                .expect("failed to register default hotkey");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            riot::get_riot_session,
            riot::get_rank,
            lookup::lookup_player,
            agents::get_agents,
            matches::get_matches,
            ai::ai_chat,
            player::get_player_matches,
            player::get_match_detail,
            player::get_player_rank,
            player::get_match_ranks,
            cache::clear_cache,
            register_hotkey,
            admin::admin_login,
            admin::admin_logout,
            admin::admin_is_authenticated,
            admin::get_local_tournaments,
            admin::save_local_tournaments
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
