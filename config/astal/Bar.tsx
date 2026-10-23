import { Astal, Gtk } from "ags/gtk4";
import { createPoll } from "ags/time";
import { Popup } from "./Popup";
import { PopupManager, PopupName } from "./PopupManager";
import { run } from "./services";
import { loadSettings } from "./state";

const settings = loadSettings();

const clock = createPoll("--:--", 1000, ["date", "+" + settings.clock_format]);
const weather = createPoll("", 900000, ["noir-weather"]);
const notifs = createPoll("󰂚", 5000, ["bash", "-c", "dunstctl count waiting 2>/dev/null | tr -d '\\n' | xargs -I{} echo '󰂚 {}'|| echo '󰂚'"]);
const cpu = createPoll("CPU --%", 2000, ["bash", "-c", "top -bn1 | grep 'Cpu(s)' | awk '{print \"󰻠 \" int($2) \"%\"}'"]);
const mem = createPoll("RAM --%", 2000, ["bash", "-c", "free | awk '/Mem:/{printf \"󰘚 %d%%\", $3/$2*100}'"]);
const disk = createPoll("DSK --%", 10000, ["bash", "-c", "df / | awk 'NR==2{printf \"󰋊 %s\", $5}'"]);
const vol = createPoll("󰕿 --%", 2000, ["bash", "-c", "wpctl get-volume @DEFAULT_AUDIO_SINK@ 2>/dev/null | awk '{v=int($2*100); m=$3==\"[MUTED]\"; printf \"%(m?\"󰖁\":\"󰕿\") %d%%\", v}' || echo '󰕿 --%'"]);
const mic = createPoll("󰍬 --%", 2000, ["bash", "-c", "wpctl get-volume @DEFAULT_AUDIO_SOURCE@ 2>/dev/null | awk '{printf \"󰍬 %d%%\", int($2*100)}' || echo '󰍬 --%'"]);
const bright = createPoll("󰃠 --%", 3000, ["bash", "-c", "brightnessctl g 2>/dev/null | xargs -I{} bash -c 'm=$(brightnessctl m); echo \"󰃠 $(({}*100/m))%\"' || echo '󰃠 --%'"]);
const bat = createPoll("󰁹 --%", 30000, ["bash", "-c", "cat /sys/class/power_supply/BAT0/capacity 2>/dev/null | xargs -I{} echo '󰁹 {}%' || echo '󰁹 --%%'"]);
const workspaces = createPoll("[]", 500, ["niri", "msg", "--json", "workspaces"]);

function Workspaces() {
  return (
    <box spacing={2}>
      {workspaces.as((raw: string) => {
        let ws: Array<{ id: number; name: string; is_focused: boolean }> = [];
        try { ws = JSON.parse(raw); } catch { return [<label label="1" />]; }
        return ws.map(w => (
          <button
            cssClasses={w.is_focused ? ["workspace-active"] : ["workspace"]}
            onClicked={() => run(["niri", "msg", "action", "focus-workspace", String(w.id)])}
            label={w.name ?? String(w.id)}
          />
        ));
      })}
    </box>
  );
}

function Btn({ icon, popup }: { icon: string; popup: PopupName }) {
  return (
    <button
      cssClasses={["bar-btn"]}
      onClicked={() => PopupManager.toggle(popup)}
      label={icon}
    />
  );
}

function PopBtn({ stat, popup }: { stat: ReturnType<typeof createPoll>; popup: PopupName }) {
  return (
    <button
      cssClasses={["bar-btn"]}
      onClicked={() => PopupManager.toggle(popup)}
      label={stat}
    />
  );
}

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
        <box $type="start" spacing={4} cssClasses={["bar-left"]}>
          <Workspaces />
          <Btn icon="󰕮" popup="quick" />
        </box>

        {/* CENTER */}
        <box $type="center" spacing={6} cssClasses={["bar-center"]}>
          <button cssClasses={["bar-btn"]} onClicked={() => PopupManager.toggle("calendar")} label={clock} />
          <label label={weather} cssClasses={["bar-weather"]} />
          <button cssClasses={["bar-btn"]} onClicked={() => PopupManager.toggle("notifications")} label={notifs} />
        </box>

        {/* RIGHT */}
        <box $type="end" spacing={4} cssClasses={["bar-right"]}>
          <label label={cpu} cssClasses={["bar-stat"]} />
          <label label={mem} cssClasses={["bar-stat"]} />
          <label label={disk} cssClasses={["bar-stat"]} />
          <button cssClasses={["bar-btn"]} onClicked={() => PopupManager.toggle("audio")} label={vol} />
          <button cssClasses={["bar-btn"]} onClicked={() => PopupManager.toggle("audio")} label={mic} />
          <button cssClasses={["bar-btn"]} onClicked={() => PopupManager.toggle("display")} label={bright} />
          <label label={bat} cssClasses={["bar-stat"]} />
          <button cssClasses={["bar-btn"]} onClicked={() => PopupManager.toggle("network")} label="󰤨" />
          <button cssClasses={["bar-btn"]} onClicked={() => PopupManager.toggle("bluetooth")} label="󰂯" />
          <button cssClasses={["bar-btn"]} onClicked={() => PopupManager.toggle("system")} label="󰐥" />
        </box>
      </centerbox>
    </window>
  );
}
