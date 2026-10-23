import GLib from "gi://GLib";

export type AstalSettings = {
  height: number;
  spacing: number;
  font_size: number;
  padding: number;
  radius: number;
  clock_format: string;
  weather_location: string;
  opacity: number;
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  border: string;
  accent: string;
  visible_modules: string[];
};

export const defaultModules = [
  "workspaces", "clock", "weather", "notifications", "cpu", "memory", "disk",
  "volume", "mic", "brightness", "battery", "network", "bluetooth", "settings", "power",
];

const defaults: AstalSettings = {
  height: 32, spacing: 8, font_size: 11, padding: 6, radius: 4,
  clock_format: "%H:%M %a, %b %d", weather_location: "Colombo", opacity: 100,
  background: "#000000", surface: "#121215", foreground: "#f3f3f5",
  muted: "#9999a1", border: "#29292f", accent: "#cfcfcf",
  visible_modules: defaultModules,
};

/** Load palette colors from noir-palette's state file when the palette is enabled. */
function loadPaletteColors(): Partial<AstalSettings> {
  const path = `${GLib.get_user_config_dir()}/noir-rice/palette.json`;
  try {
    const [, bytes] = GLib.file_get_contents(path);
    const state = JSON.parse(new TextDecoder().decode(bytes));
    if (!state.enabled || !state.colors) return {};
    const colors = state.colors as Record<string, string>;
    const mode = state.mode ?? "accent";
    const result: Partial<AstalSettings> = {
      accent: colors.accent,
      foreground: colors.foreground,
      muted: colors.muted,
      border: colors.border,
    };
    // In "background" or "full" mode the palette also overrides surface colors
    if (mode === "background" || mode === "full") {
      result.background = colors.background;
      result.surface = colors.surface;
    }
    return result;
  } catch (_) { return {}; }
}

export function loadSettings(): AstalSettings {
  const path = `${GLib.get_user_config_dir()}/noir-rice/astal.json`;
  let loaded: Record<string, unknown> = {};
  try {
    const [, bytes] = GLib.file_get_contents(path);
    loaded = JSON.parse(new TextDecoder().decode(bytes));
  } catch (_) { /* use defaults */ }

  // Merge: defaults < astal.json < palette colors (when enabled)
  const palette = loadPaletteColors();
  return {
    ...defaults,
    ...loaded,
    ...palette,
    visible_modules: Array.isArray(loaded.visible_modules)
      ? loaded.visible_modules as string[]
      : defaultModules,
  };
}
