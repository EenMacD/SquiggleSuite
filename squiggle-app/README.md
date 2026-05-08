# Squiggle App (Tauri)

This is the native desktop version of Squiggle, built with **Tauri** (Rust backend + Vue 3 frontend).

## Development

To run the app locally in development mode (with hot-module reloading):
```bash
npm install
npm run tauri dev
```

## Distribution (Building Native Installers)

To build the standalone, native desktop application (e.g., `.app` / `.dmg` on macOS, `.exe` / `.msi` on Windows):

1. **Ensure prerequisites are installed** (Rust, Node.js).
2. Run the Tauri build command:
   ```bash
   npm run tauri build
   ```
3. The generated installers will be located in:
   - `src-tauri/target/release/bundle/dmg/` (for macOS)
   - `src-tauri/target/release/bundle/msi/` (for Windows, if built on Windows)

### Serving the Downloads
To serve these as a download on a homepage (like Docker does), you simply need to build the `.dmg` on a Mac and the `.msi` on Windows, then upload those output files to your web server or GitHub Releases. Your homepage can then detect the user's OS via JavaScript and offer the appropriate download link.

By design, a `.dmg` will only install on macOS, and an `.msi` will only install on Windows. If someone tries to run it on an unsupported OS, their system will natively reject it.
