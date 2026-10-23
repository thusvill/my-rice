import { Astal, Gtk } from "ags/gtk4";
import { createPoll } from "ags/time";
import { Popup } from "./Popup";
import { PopupManager, PopupName } from "./PopupManager";
import { run } from "./services";
import { loadSettings } from "./state";

const settings = loadSettings();

// ── polls ────────────────────────────────────────────────────────────────────
const clock      = createPoll("--:--",  1000,  ["date", "+" + settings.clock_format]);
const weather    = createPoll("",       900000, ["env", `NOIR_WEATHER_LOCATION=${settings.weather_location}`, "noir-weather"]);
const notifs     = createPoll("󰂚 0",   2000,  ["noir-notifications"]);
const brightness = createPoll("󰃠 --",  3000,  ["noir-brightness"]);
const cpu        = createPoll("󰻠 --%", 2000,  ["bash", "-c",
  "top -bn1 | awk '/^%Cpu/{printf \"\\xef\\xae\\xa0 %d%%\", 100-$8}'"]);
const mem        = createPoll("󰘚 --%", 2000,  ["bash", "-c",
  "free | awk '/Mem:/{printf \"\\xef\\x96\\x82 %d%%\", int($3/$2*100)}'"]);
const disk       = createPoll("󰋊 --%", 15000, ["bash", "-c",
  "df / | awk 'NR==2{printf \"\\xef\\x8a\\x8a %s\", $5}'"]);
const volume     = createPoll("󰕿 --%", 1000,  ["bash", "-c",
  "wpctl get-volume @DEFAULT_AUDIO_SINK@ 2>/dev/null | awk '{m=($3==\"[MUTED]\"); printf (m?\"\\xef\\x97\\xa1\":\"\\xef\\x97\\xbf\")\" %d%%\",int($2*100)}' || echo '󰕿 --'"]);
const mic        = createPoll("󰍬 --%", 1000,  ["bash", "-c",
  "wpctl get-volume @DEFAULT_AUDIO_SOURCE@ 2>/dev/null | awk '{m=($3==\"[MUTED]\"); printf (m?\"\\xef\\x8b\\xad\":\"\\xef\\x8b\\xac\")\" %d%%\",int($2*100)}' || echo '󰍬 --'"]);
const battery    = createPoll("󰁹 --",  30000, ["bash", "-c",
  "cap=$(cat /sys/class/power_supply/BAT0/capacity 2>/dev/null); stat=$(cat /sys/class/power_supply/BAT0/status 2>/dev/null); [ -n \"$cap\" ] && ([ \"$stat\" = \"Charging\" ] && echo \"󰂄 ${cap}%\" || echo \"󰁹 ${cap}%\") || echo '󰁹 --'"]);
const network    = createPoll("󰤭",    5000,  ["bash", "-c",
  "nmcli -t -f TYPE,STATE,CONNECTION device 2>/dev/null | awk -F: '/wifi:connected/{print \"󰤨 \" $3; found=1} /ethernet:connected/{print \"󰈀 \" $3; found=1} END{if(!found)print \"󰤭\"}' | head -1 || echo '󰤭'"]);
const workspacesRaw = createPoll("[]", 500, ["niri", "msg", "--json", "workspaces"]);

// ── Workspaces ───────────────────────────────────────────────────────────────
function WorkspaceButtons() {
  return (
    <box spacing={settings.spacing}>
      {workspacesRaw.as((raw: string) => {
        let list: { id: number; name?: string; is_focused: boolean }[] = [];
        try { list = JSON.parse(raw); } catch { /* niri not running yet */ }
        if (list.length === 0) {
          return [<label label="1" cssClasses={["workspace-active"]} />];
        }
        return list.map(w => (
          <button
            cssClasses={w.is_focused ? ["workspace-active"] : ["workspace"]}
            onClicked={() => run(["niri", "msg", "action", "focus-workspace", String(w.id)])}
            label={w.name ? w.name : String(w.id)}
          />
        ));
      })}
    </box>
  );
}

// ── Bar window ───────────────────────────────────────────────────────────────
export function Bar(gdkmonitor: Astal.Monitor) {
  return (
    <window
      class="bar"
      name={"noir-bar-" + gdkmonitor.model}
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT}
    >
      <centerbox>
        {/* LEFT */}
        <box $type="start" spacing={settings.spacing}>
          {settings.visible_modules.includes("workspaces") && <WorkspaceButtons />}
          {settings.visible_modules.includes("settings") && <button cssClasses={["bar-btn"]} onClicked={() => PopupManager.toggle("quick")} label="󰕮" />}
        </box>

        {/* CENTER */}
        <box $type="center" spacing={settings.spacing}>
          {settings.visible_modules.includes("clock") && <button cssClasses={["bar-btn"]} onClicked={() => PopupManager.toggle("calendar")} label={clock} />}
          {settings.visible_modules.includes("weather") && <label label={weather} cssClasses={["bar-stat"]} />}
          {settings.visible_modules.includes("notifications") && <button cssClasses={["bar-btn"]} onClicked={() => PopupManager.toggle("notifications")} label={notifs} />}
        </box>

        {/* RIGHT */}
        <box $type="end" spacing={settings.spacing}>
          {settings.visible_modules.includes("cpu") && <label label={cpu} cssClasses={["bar-stat"]} />}
          {settings.visible_modules.includes("memory") && <label label={mem} cssClasses={["bar-stat"]} />}
          {settings.visible_modules.includes("disk") && <label label={disk} cssClasses={["bar-stat"]} />}
          {settings.visible_modules.includes("volume") && <button cssClasses={["bar-btn"]} onClicked={() => PopupManager.toggle("audio")} label={volume} />}
          {settings.visible_modules.includes("mic") && <button cssClasses={["bar-btn"]} onClicked={() => PopupManager.toggle("audio")} label={mic} />}
          {settings.visible_modules.includes("brightness") && <button cssClasses={["bar-btn"]} onClicked={() => PopupManager.toggle("display")} label={brightness} />}
          {settings.visible_modules.includes("battery") && <label label={battery} cssClasses={["bar-stat"]} />}
          {settings.visible_modules.includes("network") && <button cssClasses={["bar-btn"]} onClicked={() => PopupManager.toggle("network")} label={network} />}
          {settings.visible_modules.includes("bluetooth") && <button cssClasses={["bar-btn"]} onClicked={() => PopupManager.toggle("bluetooth")} label="󰂯" />}
          {settings.visible_modules.includes("settings") && <button cssClasses={["bar-btn"]} onClicked={() => PopupManager.toggle("quick")} label="󰒓" />}
          {settings.visible_modules.includes("power") && <button cssClasses={["bar-btn"]} onClicked={() => PopupManager.toggle("system")} label="󰐥" />}
        </box>
      </centerbox>
    </window>
  );
}

// ── Popup windows (one per popup type, mounted separately) ───────────────────
export function PopupWindows(gdkmonitor: Astal.Monitor) {
  const names: PopupName[] = [
    "audio", "network", "display", "bluetooth",
    "notifications", "system", "quick", "calendar", "media",
  ];
  return names.map(name => (
    <window
      name={"popup-" + name}
      gdkmonitor={gdkmonitor}
      visible={PopupManager.activePopup.as(p => p === name)}
      cssClasses={["popup-window"]}
      exclusivity={Astal.Exclusivity.IGNORE}
      anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
      keymode={Astal.Keymode.ON_DEMAND}
    >
      <Popup name={name} />
    </window>
  ));
}
