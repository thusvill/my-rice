import { Gtk } from "ags/gtk4";
import { PopupName, PopupManager } from "./PopupManager";
import { command, helper } from "./services";

const Section = (title: string, children: unknown[]) => (
  <box orientation={Gtk.Orientation.VERTICAL} spacing={8} cssClasses={["popup-section"]}>
    <label label={title} halign={Gtk.Align.START} cssClasses={["section-title"]} />
    {children}
  </box>
);

const Action = (label: string, action: () => void) =>
  <button label={label} onClicked={action} hexpand />;

export function Popup({ name }: { name: PopupName }) {
  const content: Record<PopupName, unknown> = {
    audio: Section("AUDIO", [
      <label label="PipeWire output and input" halign={Gtk.Align.START} />,
      <slider hexpand min={0} max={100} value={50} onValueChanged={(s) => command("wpctl", "set-volume", "@DEFAULT_AUDIO_SINK@", `${s.value / 100}`)} />,
      Action("Mute output", () => command("wpctl", "set-mute", "@DEFAULT_AUDIO_SINK@", "toggle")),
      Action("Mute microphone", () => command("wpctl", "set-mute", "@DEFAULT_AUDIO_SOURCE@", "toggle")),
    ]),
    network: Section("NETWORK", [
      <label label="NetworkManager" halign={Gtk.Align.START} />,
      Action("Toggle Wi-Fi", () => command("nmcli", "radio", "wifi", "toggle")),
      Action("Enable all radios", () => command("nmcli", "radio", "all", "on")),
      Action("Refresh networks", () => command("nmcli", "device", "wifi", "list")),
    ]),
    display: Section("DISPLAY", [
      Action("Brightness down", () => helper("noir-brightness", "down")),
      Action("Brightness up", () => helper("noir-brightness", "up")),
      Action("Display profiles", () => helper("noir-display-menu")),
    ]),
    bluetooth: Section("BLUETOOTH", [
      Action("Open Bluetooth control", () => command("blueman-manager")),
    ]),
    media: Section("MEDIA", [
      Action("Previous", () => command("playerctl", "previous")),
      Action("Play / pause", () => command("playerctl", "play-pause")),
      Action("Next", () => command("playerctl", "next")),
    ]),
    notifications: Section("NOTIFICATIONS", [
      Action("Notification history", () => command("dunstctl", "history-pop")),
      Action("Clear notifications", () => command("dunstctl", "close-all")),
      Action("Pause / resume", () => command("dunstctl", "set-paused", "toggle")),
    ]),
    system: Section("SYSTEM", [
      Action("Lock", () => helper("noir-lockscreen")),
      Action("Screenshot", () => helper("noir-screenshot")),
      Action("Power menu", () => command("wlogout", "-b", "4", "-c", "16", "-r", "0", "-m", "340", "-s")),
      Action("Noir settings", () => helper("noir-settings")),
    ]),
    quick: Section("QUICK SETTINGS", [
      Action("Audio", () => PopupManager.toggle("audio")),
      Action("Network", () => PopupManager.toggle("network")),
      Action("Display", () => PopupManager.toggle("display")),
      Action("System", () => PopupManager.toggle("system")),
    ]),
    calendar: Section("CALENDAR", [
      <label label="Calendar is provided by the native GTK popover." />,
    ]),
  };
  return <box orientation={Gtk.Orientation.VERTICAL} spacing={12} cssClasses={["popup"]}>{content[name]}</box>;
}
