import { Astal, Gtk } from "ags/gtk4";
import { createPoll } from "ags/time";
import GLib from "gi://GLib";
import { Popup } from "./Popup";
import { PopupManager, PopupName, PopupAnchorSide } from "./PopupManager";
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
const workspacesRaw = createPoll("[]", 300, ["niri", "msg", "--json", "workspaces"]);

// ── Workspaces ───────────────────────────────────────────────────────────────
function WorkspaceButtons() {
  const container = new Gtk.Box({ spacing: settings.spacing });

  const updateChildren = (raw?: string) => {
    const jsonStr = typeof raw === "string" ? raw : workspacesRaw.get();
    let list: { id: number; idx: number; name?: string | null; is_focused: boolean }[] = [];
    try { list = JSON.parse(jsonStr); } catch { /* niri not running yet */ }

    // Sort by idx for consistent ordering (1, 2, 3...)
    list.sort((a, b) => a.idx - b.idx);

    // Remove existing children
    let child = container.get_first_child();
    while (child) {
      const next = child.get_next_sibling();
      container.remove(child);
      child = next;
    }

    if (list.length === 0) {
      const label = new Gtk.Label({ label: "1", css_classes: ["workspace-active"] });
      container.append(label);
      return;
    }

    for (const w of list) {
      const btn = new Gtk.Button({
        label: w.name ?? String(w.idx),
        css_classes: [w.is_focused ? "workspace-active" : "workspace"],
      });
      btn.connect("clicked", () => {
        run(["niri", "msg", "action", "focus-workspace", String(w.idx)]);
      });
      container.append(btn);
    }
  };

  // Initial render
  updateChildren(workspacesRaw.get());

  // createPoll subscriber callback has no arguments, so read latest from workspacesRaw.get()
  workspacesRaw.subscribe(() => {
    updateChildren(workspacesRaw.get());
  });

  return container;
}

// ── Bar window ───────────────────────────────────────────────────────────────
export function Bar(gdkmonitor: Astal.Monitor) {
  /** Helper: popup button that records which side of the bar it lives on */
  const popBtn = (
    label: string | ReturnType<typeof createPoll>,
    name: PopupName,
    side: PopupAnchorSide,
  ) => (
    <button
      cssClasses={["bar-btn"]}
      onClicked={() => PopupManager.toggle(name, side)}
      label={label}
    />
  );

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
          {settings.visible_modules.includes("settings") && popBtn("󰕮", "quick", "left")}
        </box>

        {/* CENTER */}
        <box $type="center" spacing={settings.spacing}>
          {settings.visible_modules.includes("clock")         && popBtn(clock,  "calendar",      "center")}
          {settings.visible_modules.includes("weather")       && <label label={weather} cssClasses={["bar-stat"]} />}
          {settings.visible_modules.includes("notifications") && popBtn(notifs, "notifications", "center")}
        </box>

        {/* RIGHT */}
        <box $type="end" spacing={settings.spacing}>
          {settings.visible_modules.includes("cpu")       && <label label={cpu}  cssClasses={["bar-stat"]} />}
          {settings.visible_modules.includes("memory")    && <label label={mem}  cssClasses={["bar-stat"]} />}
          {settings.visible_modules.includes("disk")      && <label label={disk} cssClasses={["bar-stat"]} />}
          {settings.visible_modules.includes("volume")    && popBtn(volume,     "audio",     "right")}
          {settings.visible_modules.includes("mic")       && popBtn(mic,        "audio",     "right")}
          {settings.visible_modules.includes("brightness")&& popBtn(brightness, "display",   "right")}
          {settings.visible_modules.includes("battery")   && <label label={battery} cssClasses={["bar-stat"]} />}
          {settings.visible_modules.includes("network")   && popBtn(network,    "network",   "right")}
          {settings.visible_modules.includes("bluetooth") && popBtn("󰂯",        "bluetooth", "right")}
          {settings.visible_modules.includes("settings")  && popBtn("󰒓",        "quick",     "right")}
          {settings.visible_modules.includes("power")     && popBtn("󰐥",        "system",    "right")}
        </box>
      </centerbox>
    </window>
  );
}

// ── Popup windows (one per popup type, mounted separately) ───────────────────
export function PopupWindows(gdkmonitor: Astal.Monitor) {
  const popupConfigs: Record<PopupName, { anchor: number; marginLeft?: number; marginRight?: number }> = {
    calendar:      { anchor: Astal.WindowAnchor.TOP, marginRight: 0 },
    notifications: { anchor: Astal.WindowAnchor.TOP, marginLeft: 80 },
    audio:         { anchor: Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT, marginRight: 220 },
    display:       { anchor: Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT, marginRight: 150 },
    network:       { anchor: Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT, marginRight: 85 },
    bluetooth:     { anchor: Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT, marginRight: 55 },
    system:        { anchor: Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT, marginRight: 8 },
    quick:         { anchor: Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT, marginRight: 30 },
    media:         { anchor: Astal.WindowAnchor.TOP, marginRight: 0 },
  };

  const names: PopupName[] = [
    "audio", "network", "display", "bluetooth",
    "notifications", "system", "quick", "calendar", "media",
  ];

  return names.map(name => {
    const config = popupConfigs[name];

    const win = (
      <window
        name={"popup-" + name}
        gdkmonitor={gdkmonitor}
        visible={false}
        cssClasses={["popup-window"]}
        exclusivity={Astal.Exclusivity.IGNORE}
        anchor={config.anchor}
        keymode={Astal.Keymode.ON_DEMAND}
        marginTop={settings.height + 4}
        marginLeft={config.marginLeft ?? 0}
        marginRight={config.marginRight ?? 0}
      >
        <Popup name={name} />
      </window>
    ) as Astal.Window;

    // Reactively open/close and place under the clicked item
    PopupManager.activePopup.subscribe(() => {
      const active = PopupManager.activePopup.get();
      if (active === name) {
        if (name === "quick" && PopupManager.popupAnchor() === "left") {
          win.anchor = Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT;
          win.margin_left = 70;
          win.margin_right = 0;
        } else {
          win.anchor = config.anchor;
          win.margin_left = config.marginLeft ?? 0;
          win.margin_right = config.marginRight ?? 0;
        }
        win.set_visible(true);
        win.present();
      } else {
        win.set_visible(false);
      }
    });

    // Close on Escape
    const keyCtrl = new Gtk.EventControllerKey();
    keyCtrl.connect("key-pressed", (_: unknown, keyval: number) => {
      if (keyval === 65307) { PopupManager.close(); return true; }
      return false;
    });
    win.add_controller(keyCtrl);

    // Close when window loses focus (click outside)
    const focusCtrl = new Gtk.EventControllerFocus();
    focusCtrl.connect("leave", () => {
      GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
        if (!win.is_active) PopupManager.close();
        return GLib.SOURCE_REMOVE;
      });
    });
    win.add_controller(focusCtrl);

    return win;
  });
}
