import app from "ags/gtk4/app";
import { Gdk } from "ags/gtk4";
import GLib from "gi://GLib";
import { Bar, PopupWindows } from "./Bar";
import { loadSettings } from "./state";

const settings = loadSettings();
const theme = (() => {
  try {
    const [, bytes] = GLib.file_get_contents(`${GLib.get_user_config_dir()}/astal/theme.css`);
    return new TextDecoder().decode(bytes);
  } catch (_) { return ""; }
})();

const css = `
* { font-family: "JetBrains Mono Nerd Font", "JetBrains Mono", monospace; font-size: ${settings.font_size}px; }
:root {
  --noir-background: ${settings.background}; --noir-surface: ${settings.surface};
  --noir-accent: ${settings.accent}; --noir-foreground: ${settings.foreground};
  --noir-muted: ${settings.muted}; --noir-border: ${settings.border};
}

/* ── Bar ──────────────────────────────────────────────────────────── */
.bar {
  background: var(--noir-background, #000000);
  color:      var(--noir-foreground, #f3f3f5);
  border: 1px solid var(--noir-border, #222226);
  border-radius: ${settings.radius}px;
  padding: 0 ${settings.padding}px;
  opacity: ${Math.max(0.4, Math.min(1, settings.opacity / 100))};
  min-height: ${settings.height}px;
}
button.bar-btn {
  background: transparent;
  color:      var(--noir-muted, #9999a1);
  border:     0;
  border-radius: ${settings.radius}px;
  padding:    1px ${Math.max(2, settings.padding / 2)}px;
  min-height: ${settings.height}px;
}
button.bar-btn:hover {
  background: var(--noir-surface, #121215);
  color:      var(--noir-foreground, #f3f3f5);
}
button.workspace {
  background: transparent;
  color:      var(--noir-muted, #9999a1);
  border:     0;
  border-radius: ${settings.radius}px;
  padding:    1px ${settings.padding}px;
  min-height: ${settings.height}px;
}
button.workspace-active {
  background: var(--noir-accent, #cfcfcf);
  color:      var(--noir-background, #000000);
  border:     1px solid var(--noir-accent, #cfcfcf);
  border-radius: ${settings.radius}px;
  font-weight: 700;
  padding:    1px ${settings.padding}px;
  min-height: ${settings.height}px;
}
button.workspace:hover {
  background: var(--noir-surface, #1a1a1e);
  color:      var(--noir-foreground, #f3f3f5);
}
button.workspace-active:hover {
  background: var(--noir-accent, #cfcfcf);
  color:      var(--noir-background, #000000);
}
label.bar-stat {
  color:   var(--noir-muted, #9999a1);
  padding: 0 4px;
}

/* ── Popup window ─────────────────────────────────────────────────── */
window.popup-window {
  background: transparent;
}
.popup {
  background:    var(--noir-surface, #0c0c0e);
  color:         var(--noir-foreground, #f3f3f5);
  border:        1px solid var(--noir-border, #29292f);
  border-radius: 10px;
  padding:       0;
  min-width:     320px;
}
.popup-content {
  padding: 14px 16px 16px;
}
.popup-title {
  color:        var(--noir-foreground, #f3f3f5);
  font-weight:  700;
  font-size:    11px;
  margin-bottom: 2px;
}
.popup-label {
  color: var(--noir-muted, #9999a1);
}
.popup-val {
  color: var(--noir-foreground, #f3f3f5);
}
.popup-icon {
  color:      var(--noir-muted, #9999a1);
  min-width:  16px;
}
.popup-btn {
  background:    var(--noir-background, #000000);
  color:         var(--noir-foreground, #f3f3f5);
  border:        1px solid var(--noir-border, #29292f);
  border-radius: 5px;
  padding:       5px 10px;
}
.popup-btn:hover {
  background: var(--noir-accent, #cfcfcf);
  color:      #000;
  border-color: var(--noir-accent, #cfcfcf);
}
.popup-btn-active {
  background:   var(--noir-surface, #1a1a1e);
  border-color: var(--noir-accent, #cfcfcf);
  color:        var(--noir-accent, #cfcfcf);
}
.popup-sep {
  background: var(--noir-border, #29292f);
  min-height: 1px;
  margin:     4px 0;
}
.popup-media-title {
  font-size:   12px;
  font-weight: 700;
  color:       var(--noir-foreground, #f3f3f5);
}
.popup-cal {
  font-family: monospace;
  color:       var(--noir-muted, #9999a1);
}
slider trough {
  background:  var(--noir-border, #29292f);
  min-height:  4px;
  border-radius: 2px;
}
slider highlight {
  background:  var(--noir-accent, #cfcfcf);
  border-radius: 2px;
}
`;

app.start({ css: css + theme, main() {
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

    for (const pw of PopupWindows(monitor)) {
      app.add_window(pw);
    }
  }
} });
