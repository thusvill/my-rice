import { Gtk } from "ags/gtk4";
import { createPoll } from "ags/time";
import { createState } from "ags";
import { PopupName, PopupManager } from "./PopupManager";
import { run, command } from "./services";

// ── helpers ──────────────────────────────────────────────────────────────────

function Title(text: string) {
  return <label label={text} halign={Gtk.Align.START} cssClasses={["popup-title"]} />;
}

function Row(children: unknown[]) {
  return <box orientation={Gtk.Orientation.HORIZONTAL} spacing={6}>{children}</box>;
}

function Btn(label: string, onClick: () => void, expand = true) {
  return <button cssClasses={["popup-btn"]} onClicked={onClick} label={label} hexpand={expand} />;
}

function Sep() {
  return <box cssClasses={["popup-sep"]} heightRequest={1} />;
}

// ── Audio ─────────────────────────────────────────────────────────────────────
function AudioPopup() {
  const vol    = createPoll(50,  500,  ["bash", "-c", "wpctl get-volume @DEFAULT_AUDIO_SINK@   2>/dev/null | awk '{print int($2*100)}' || echo 50"]);
  const micVol = createPoll(50,  500,  ["bash", "-c", "wpctl get-volume @DEFAULT_AUDIO_SOURCE@ 2>/dev/null | awk '{print int($2*100)}' || echo 50"]);
  const muted  = createPoll("0", 500,  ["bash", "-c", "wpctl get-volume @DEFAULT_AUDIO_SINK@   2>/dev/null | grep -c MUTED || echo 0"]);
  const micMut = createPoll("0", 500,  ["bash", "-c", "wpctl get-volume @DEFAULT_AUDIO_SOURCE@ 2>/dev/null | grep -c MUTED || echo 0"]);

  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={10} cssClasses={["popup-content"]}>
      {Title("󰕾  AUDIO OUTPUT")}
      <box orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
        <label label={muted.as((m: string) => m.trim() === "1" ? "󰖁" : "󰕾")} cssClasses={["popup-icon"]} />
        <slider hexpand min={0} max={100}
          value={vol.as((v: number) => v)}
          onValueChanged={(s) => command("wpctl", "set-volume", "@DEFAULT_AUDIO_SINK@", String(s.value / 100))}
        />
        <label label={vol.as((v: number) => v + "%")} cssClasses={["popup-val"]} />
      </box>
      {Row([
        Btn(muted.as((m: string) => m.trim() === "1" ? "󰕾 Unmute" : "󰖁 Mute"),
          () => command("wpctl", "set-mute", "@DEFAULT_AUDIO_SINK@", "toggle")),
        Btn("󰙂 Mixer", () => command("pavucontrol")),
      ])}
      {Sep()}
      {Title("󰍬  MIC INPUT")}
      <box orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
        <label label={micMut.as((m: string) => m.trim() === "1" ? "󰍭" : "󰍬")} cssClasses={["popup-icon"]} />
        <slider hexpand min={0} max={100}
          value={micVol.as((v: number) => v)}
          onValueChanged={(s) => command("wpctl", "set-volume", "@DEFAULT_AUDIO_SOURCE@", String(s.value / 100))}
        />
        <label label={micVol.as((v: number) => v + "%")} cssClasses={["popup-val"]} />
      </box>
      {Row([
        Btn(micMut.as((m: string) => m.trim() === "1" ? "󰍬 Unmute mic" : "󰍭 Mute mic"),
          () => command("wpctl", "set-mute", "@DEFAULT_AUDIO_SOURCE@", "toggle")),
      ])}
    </box>
  );
}

// ── Network ───────────────────────────────────────────────────────────────────
function NetworkPopup() {
  const wifiState = createPoll("unknown", 3000, ["bash", "-c",
    "nmcli radio wifi 2>/dev/null || echo unknown"]);
  const networks  = createPoll("", 8000, ["bash", "-c",
    "nmcli -t -f IN-USE,SSID,SIGNAL,SECURITY device wifi list --rescan no 2>/dev/null | head -12 || echo ''"]);
  const connected = createPoll("", 3000, ["bash", "-c",
    "nmcli -t -f TYPE,STATE,CONNECTION device 2>/dev/null | awk -F: '/connected/{print $3}' | head -1 || echo ''"]);

  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={10} cssClasses={["popup-content"]}>
      {Title("󰤨  NETWORK")}
      <box orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
        <label label="Connected:" cssClasses={["popup-label"]} />
        <label label={connected} cssClasses={["popup-val"]} hexpand />
      </box>
      {Row([
        Btn(wifiState.as((s: string) => s.trim() === "enabled" ? "󰤭 Disable Wi-Fi" : "󰤨 Enable Wi-Fi"),
          () => command("nmcli", "radio", "wifi", wifiState() === "enabled" ? "off" : "on")),
        Btn("󰈀 nmtui", () => command("kitty", "nmtui")),
      ])}
      {Sep()}
      {Title("  AVAILABLE NETWORKS")}
      <box orientation={Gtk.Orientation.VERTICAL} spacing={4}>
        {networks.as((raw: string) => {
          if (!raw.trim()) return [<label label="No networks found" cssClasses={["popup-label"]} />];
          return raw.trim().split("\n").filter(l => l.trim()).map(line => {
            const [active, ssid, signal] = line.split(":").map(s => s.trim());
            if (!ssid) return null;
            const icon = parseInt(signal || "0") > 70 ? "󰤨" : parseInt(signal || "0") > 40 ? "󰤥" : "󰤢";
            return (
              <button cssClasses={active === "*" ? ["popup-btn", "popup-btn-active"] : ["popup-btn"]}
                onClicked={() => command("nmcli", "device", "wifi", "connect", ssid)}
                label={(active === "*" ? "● " : "  ") + icon + " " + ssid + "  " + (signal || "?") + "%"}
                halign={Gtk.Align.FILL}
              />
            );
          }).filter(Boolean);
        })}
      </box>
    </box>
  );
}

// ── Display ───────────────────────────────────────────────────────────────────
function DisplayPopup() {
  const bright = createPoll(75, 1000, ["bash", "-c",
    "brightnessctl -m 2>/dev/null | awk -F, 'NR==1{gsub(/%/,\"\",$4);print $4}' || echo 75"]);

  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={10} cssClasses={["popup-content"]}>
      {Title("󰃠  BRIGHTNESS")}
      <box orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
        <label label="󰃞" cssClasses={["popup-icon"]} />
        <slider hexpand min={0} max={100}
          value={bright.as((v: number) => v)}
          onValueChanged={(s) => command("brightnessctl", "set", String(Math.round(s.value)) + "%")}
        />
        <label label={bright.as((v: number) => v + "%")} cssClasses={["popup-val"]} />
      </box>
      {Row([
        Btn("󰃞 -5%",  () => command("brightnessctl", "set", "5%-")),
        Btn("󰃠 +5%",  () => command("brightnessctl", "set", "5%+")),
      ])}
      {Sep()}
      {Title("󰍺  DISPLAY PROFILES")}
      {Row([
        Btn("󰹹 Extend",  () => command("noir-display-profile")),
        Btn("󰽤 Mirror",  () => command("bash", "-c", "xrandr --auto 2>/dev/null || true")),
      ])}
    </box>
  );
}

// ── Bluetooth ─────────────────────────────────────────────────────────────────
function BluetoothPopup() {
  const btState   = createPoll("", 3000, ["bash", "-c",
    "bluetoothctl show 2>/dev/null | awk '/Powered:/{print $2}' || echo off"]);
  const connected = createPoll("", 5000, ["bash", "-c",
    "bluetoothctl info 2>/dev/null | awk '/Name:/{print $2\" \"$3\" \"$4}' || echo 'None'"]);
  const devices   = createPoll("", 5000, ["bash", "-c",
    "bluetoothctl devices Paired 2>/dev/null | sed 's/Device //;s/[^ ]* //' | head -8 || echo ''"]);

  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={10} cssClasses={["popup-content"]}>
      {Title("󰂯  BLUETOOTH")}
      <box orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
        <label label="Status:" cssClasses={["popup-label"]} />
        <label label={btState.as((s: string) => s.trim() === "yes" ? "󰂯 Enabled" : "󰂲 Disabled")} cssClasses={["popup-val"]} hexpand />
      </box>
      <box orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
        <label label="Connected:" cssClasses={["popup-label"]} />
        <label label={connected} cssClasses={["popup-val"]} hexpand />
      </box>
      {Row([
        Btn(btState.as((s: string) => s.trim() === "yes" ? "󰂲 Disable" : "󰂯 Enable"),
          () => command("bash", "-c", "bluetoothctl power " + (btState() === "yes" ? "off" : "on"))),
        Btn("󰍺 Manager", () => command("blueman-manager")),
      ])}
      {Sep()}
      {Title("  PAIRED DEVICES")}
      <box orientation={Gtk.Orientation.VERTICAL} spacing={4}>
        {devices.as((raw: string) => {
          if (!raw.trim()) return [<label label="No paired devices" cssClasses={["popup-label"]} />];
          return raw.trim().split("\n").filter(l => l.trim()).map(name => (
            <button cssClasses={["popup-btn"]}
              onClicked={() => command("bash", "-c", "bluetoothctl connect " + name + " 2>/dev/null || true")}
              label={"󰂱 " + name}
              halign={Gtk.Align.FILL}
            />
          ));
        })}
      </box>
    </box>
  );
}

// ── Notifications ─────────────────────────────────────────────────────────────
function NotificationsPopup() {
  const count  = createPoll("0", 2000, ["bash", "-c", "dunstctl count history 2>/dev/null || echo 0"]);
  const paused = createPoll("false", 2000, ["bash", "-c", "dunstctl is-paused 2>/dev/null || echo false"]);

  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={10} cssClasses={["popup-content"]}>
      {Title("󰂚  NOTIFICATIONS")}
      <box orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
        <label label="History:" cssClasses={["popup-label"]} />
        <label label={count} cssClasses={["popup-val"]} hexpand />
        <label label={paused.as((p: string) => p.trim() === "true" ? "󰂛 Paused" : "󰂚 Active")} cssClasses={["popup-val"]} />
      </box>
      {Row([
        Btn("󰂚 History",      () => command("dunstctl", "history-pop")),
        Btn(paused.as((p: string) => p.trim() === "true" ? "▶ Resume" : "⏸ Pause"),
          () => command("dunstctl", "set-paused", "toggle")),
      ])}
      {Row([
        Btn("󰅙 Clear all",   () => command("dunstctl", "close-all")),
        Btn("󰂜 Close last",  () => command("dunstctl", "close")),
      ])}
    </box>
  );
}

// ── System / Power ────────────────────────────────────────────────────────────
function SystemPopup() {
  const hostname = createPoll("", 86400000, ["hostname"]);
  const uptime   = createPoll("", 30000, ["bash", "-c", "uptime -p 2>/dev/null | sed 's/up //' || echo '--'"]);
  const load     = createPoll("", 5000,  ["bash", "-c", "uptime | awk -F'load average:' '{print $2}' | xargs || echo '--'"]);

  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={10} cssClasses={["popup-content"]}>
      {Title("󰐥  SYSTEM")}
      <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
        <box spacing={8}><label label="Host:"   cssClasses={["popup-label"]} /><label label={hostname} cssClasses={["popup-val"]} /></box>
        <box spacing={8}><label label="Uptime:" cssClasses={["popup-label"]} /><label label={uptime}   cssClasses={["popup-val"]} /></box>
        <box spacing={8}><label label="Load:"   cssClasses={["popup-label"]} /><label label={load}     cssClasses={["popup-val"]} /></box>
      </box>
      {Sep()}
      {Row([
        Btn("󰍹 Lock",       () => command("noir-lockscreen")),
        Btn("󰹑 Screenshot", () => command("noir-screenshot")),
      ])}
      {Row([
        Btn("󰜉 Reboot",     () => command("systemctl", "reboot")),
        Btn("󰐥 Power off",  () => command("systemctl", "poweroff")),
      ])}
      {Row([
        Btn("󰗽 Log out",    () => command("niri", "msg", "action", "quit")),
        Btn("󰒓 Settings",   () => command("noir-settings")),
      ])}
      {Sep()}
      {Btn("󰼛 Power menu (wlogout)", () => { PopupManager.close(); command("wlogout", "-b", "4", "-c", "16", "-r", "0", "-m", "340", "-s"); })}
    </box>
  );
}

// ── Quick ─────────────────────────────────────────────────────────────────────
function QuickPopup() {
  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={10} cssClasses={["popup-content"]}>
      {Title("󰕮  QUICK SETTINGS")}
      {Row([
        Btn("󰕾 Audio",      () => PopupManager.toggle("audio")),
        Btn("󰤨 Network",    () => PopupManager.toggle("network")),
      ])}
      {Row([
        Btn("󰃠 Display",    () => PopupManager.toggle("display")),
        Btn("󰂯 Bluetooth",  () => PopupManager.toggle("bluetooth")),
      ])}
      {Row([
        Btn("󰂚 Notifs",     () => PopupManager.toggle("notifications")),
        Btn("󰐥 System",     () => PopupManager.toggle("system")),
      ])}
      {Sep()}
      {Row([
        Btn("󰏇 Launcher",   () => { PopupManager.close(); command("noir-launcher"); }),
        Btn("󰒓 Settings",   () => { PopupManager.close(); command("noir-settings"); }),
      ])}
    </box>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────
function CalendarPopup() {
  const cal = createPoll("", 60000, ["bash", "-c", "cal | cat"]);
  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={10} cssClasses={["popup-content"]}>
      {Title("󰸗  CALENDAR")}
      <label label={cal} cssClasses={["popup-cal"]} selectable={false} />
    </box>
  );
}

// ── Media ─────────────────────────────────────────────────────────────────────
function MediaPopup() {
  const artist = createPoll("--",    2000, ["bash", "-c", "playerctl metadata artist 2>/dev/null || echo '--'"]);
  const title  = createPoll("--",    2000, ["bash", "-c", "playerctl metadata title  2>/dev/null || echo '--'"]);
  const status = createPoll("Stopped", 1000, ["bash", "-c", "playerctl status 2>/dev/null || echo 'Stopped'"]);

  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={10} cssClasses={["popup-content"]}>
      {Title("󰎆  MEDIA")}
      <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
        <label label={title}  cssClasses={["popup-media-title"]}  halign={Gtk.Align.CENTER} />
        <label label={artist} cssClasses={["popup-label"]}        halign={Gtk.Align.CENTER} />
        <label label={status} cssClasses={["popup-val"]}          halign={Gtk.Align.CENTER} />
      </box>
      {Row([
        Btn("󰒮 Prev",  () => command("playerctl", "previous")),
        Btn(status.as((s: string) => s.trim() === "Playing" ? "󰏤 Pause" : "󰐊 Play"),
          () => command("playerctl", "play-pause")),
        Btn("󰒭 Next",  () => command("playerctl", "next")),
      ])}
    </box>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────
export function Popup({ name }: { name: PopupName }) {
  const content: Record<PopupName, () => JSX.Element> = {
    audio:         AudioPopup,
    network:       NetworkPopup,
    display:       DisplayPopup,
    bluetooth:     BluetoothPopup,
    notifications: NotificationsPopup,
    system:        SystemPopup,
    quick:         QuickPopup,
    calendar:      CalendarPopup,
    media:         MediaPopup,
  };
  const Component = content[name];
  return (
    <box
      orientation={Gtk.Orientation.VERTICAL}
      cssClasses={["popup"]}
    >
      <Component />
    </box>
  );
}
