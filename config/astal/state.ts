import GLib from "gi://GLib";

export type AstalSettings = {
  height: number;
  spacing: number;
  clock_format: string;
  weather_location: string;
  opacity: number;
  visible_modules: string[];
};

const defaults: AstalSettings = {
  height: 11, spacing: 8, clock_format: "%H:%M %a, %b %d",
  weather_location: "Colombo", opacity: 100, visible_modules: [],
};

export function loadSettings(): AstalSettings {
  const path = `${GLib.get_user_config_dir()}/noir-rice/astal.json`;
  try {
    const [, bytes] = GLib.file_get_contents(path);
    return { ...defaults, ...JSON.parse(new TextDecoder().decode(bytes)) };
  } catch (_) { return defaults; }
}
