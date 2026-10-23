import app from "ags/gtk4/app";
import { Gdk } from "ags/gtk4";
import GLib from "gi://GLib";
import { Bar } from "./Bar";
import { loadSettings } from "./state";

const settings = loadSettings();
const theme = (() => {
  try {
    const [, bytes] = GLib.file_get_contents(`${GLib.get_user_config_dir()}/astal/theme.css`);
    return new TextDecoder().decode(bytes);
  } catch (_) { return ""; }
})();

const css = `
* { font-family: "JetBrains Mono Nerd Font", "JetBrains Mono", monospace; font-size: 11px; }
window.bar { background: var(--noir-background, #000000); color: var(--noir-foreground, #f3f3f5); border-bottom: 1px solid var(--noir-border, #222226); padding: 0 4px; min-height: ${settings.height}px; }
.bar-left, .bar-center, .bar-right { padding: 0 2px; }
button.bar-btn { background: transparent; color: var(--noir-muted, #9999a1); border: 0; border-radius: 4px; padding: 1px 5px; min-height: ${settings.height}px; }
button.bar-btn:hover { background: #18181c; color: var(--noir-foreground, #f3f3f5); }
button.workspace { background: transparent; color: var(--noir-muted, #9999a1); border: 0; border-radius: 4px; padding: 1px 6px; min-height: ${settings.height}px; }
button.workspace-active { background: var(--noir-surface, #1a1a1e); color: var(--noir-foreground, #f3f3f5); border: 0; border-radius: 4px; padding: 1px 6px; min-height: ${settings.height}px; }
button.workspace:hover { background: #18181c; color: #fff; }
label.bar-stat { color: var(--noir-muted, #9999a1); padding: 0 4px; }
label.bar-weather { color: #c2c2c8; padding: 0 4px; }
.popup { background: var(--noir-surface, #0c0c0e); color: var(--noir-foreground, #f3f3f5); border: 1px solid var(--noir-border, #29292f); border-radius: 10px; padding: 16px; min-width: 320px; }
.popup-section { padding: 4px; }
.section-title { color: #9999a1; font-weight: 700; letter-spacing: 1px; }
slider trough { background: #222226; min-height: 5px; }
slider highlight { background: #cfcfcf; }
`;

app.start({ css: theme + css, main() {
  const display = Gdk.Display.get_default();
  const monitors = display.get_monitors();
  for (let i = 0; i < monitors.get_n_items(); i++) {
    const monitor = monitors.get_item(i);
    if (!monitor) continue;

    // Returning JSX from `main` does not mount it in AGS v3. Register each
    // Astal window with the application and present it explicitly.
    const bar = Bar(monitor);
    app.add_window(bar);
    bar.present();
  }
} });
