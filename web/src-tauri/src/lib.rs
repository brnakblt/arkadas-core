// Arkadaş Özel Eğitim - Tauri Desktop Application Library
// This library contains the core Tauri application setup and commands

use tauri::Manager;

/// Tauri command: Get application version
#[tauri::command]
fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Tauri command: Get application name
#[tauri::command]
fn get_app_name() -> String {
    "Arkadaş Özel Eğitim".to_string()
}

/// Tauri command: Show notification
#[tauri::command]
async fn show_notification(app: tauri::AppHandle, title: String, body: String) -> Result<(), String> {
    use tauri_plugin_notification::NotificationExt;
    
    app.notification()
        .builder()
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| e.to_string())
}

/// Tauri command: Open external URL
#[tauri::command]
async fn open_url(url: String) -> Result<(), String> {
    open::that(&url).map_err(|e: std::io::Error| e.to_string())
}

/// Main entry point for the Tauri application
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    // Register plugins
    builder = builder
        // Deep linking support (arkadas:// URLs)
        .plugin(tauri_plugin_deep_link::init())
        // Shell commands and open URLs
        .plugin(tauri_plugin_shell::init())
        // Native notifications
        .plugin(tauri_plugin_notification::init())
        // Native file dialogs
        .plugin(tauri_plugin_dialog::init())
        // Filesystem access
        .plugin(tauri_plugin_fs::init())
        // Clipboard access
        .plugin(tauri_plugin_clipboard_manager::init())
        // Process management
        .plugin(tauri_plugin_process::init())
        // Auto-updater
        .plugin(tauri_plugin_updater::Builder::new().build())
        // OS information
        .plugin(tauri_plugin_os::init())
        // HTTP client
        .plugin(tauri_plugin_http::init());

    // Single instance plugin (desktop only)
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // Focus the main window when another instance is launched
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
                let _ = window.unminimize();
            }
        }));
    }

    builder
        .setup(|app| {
            // Setup logging in debug mode
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Log app startup
            log::info!("Arkadaş Özel Eğitim Desktop v{} started", env!("CARGO_PKG_VERSION"));

            // Handle deep links
            #[cfg(not(any(target_os = "android", target_os = "ios")))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                if let Ok(urls) = app.deep_link().get_current() {
                    log::info!("Deep link URLs: {:?}", urls);
                    // Handle deep link URLs here
                }
            }

            Ok(())
        })
        // Register custom commands
        .invoke_handler(tauri::generate_handler![
            get_version,
            get_app_name,
            show_notification,
            open_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Arkadaş desktop application");
}
