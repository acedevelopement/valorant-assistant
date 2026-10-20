#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[allow(dead_code)]
fn hash_password_for_admin() {
    let password = "123mahad";
    match bcrypt::hash(password, 12) {
        Ok(h) => println!("BCRYPT_HASH: {}", h),
        Err(e) => println!("ERROR: {}", e),
    }
}

fn main() {
    if std::env::args().any(|a| a == "--hash") {
        hash_password_for_admin();
        return;
    }
    valorant_buddy_lib::run()
}
