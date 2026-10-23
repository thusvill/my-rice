#!/usr/bin/env bash
set -euo pipefail

package_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
user_home="${HOME}"
backup_root="${user_home}/.local/state/noir-rice/backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$backup_root" "$user_home/.config" "$user_home/.local/bin" "$user_home/.config/fish/conf.d"

backup_and_copy() {
    local source="$1"
    local target="$2"
    mkdir -p "$(dirname -- "$target")"
    if [[ -e "$target" || -L "$target" ]]; then
        mkdir -p "$backup_root/$(dirname -- "${target#"$user_home/"}")"
        cp -a "$target" "$backup_root/${target#"$user_home/"}"
    fi
    cp -a "$source" "$target"
}

while IFS= read -r -d '' source; do
    relative="${source#"$package_dir/config/"}"
    backup_and_copy "$source" "$user_home/.config/$relative"
done < <(find "$package_dir/config" -type f -print0)

while IFS= read -r -d '' source; do
    name="$(basename -- "$source")"
    case "$name" in
        noir-topbar|noir-popup) continue ;; # rollback-only Waybar daemon/client
    esac
    backup_and_copy "$source" "$user_home/.local/bin/$name"
    chmod 755 "$user_home/.local/bin/$name"
done < <(find "$package_dir/bin" -maxdepth 1 -type f -print0)

chmod 755 "$user_home/.local/bin/noir-settings" "$user_home/.local/bin/noir-wallpaper" "$user_home/.local/bin/noir-palette" "$user_home/.local/bin/noir-launcher" "$user_home/.local/bin/noir-lockscreen" "$user_home/.local/bin/noir-backup" "$user_home/.local/bin/noir-notifications" "$user_home/.local/bin/noir-weather" "$user_home/.local/bin/noir-brightness" "$user_home/.local/bin/noir-astal-check" "$user_home/.local/bin/noir-astal-install"
chmod 755 "$user_home/.local/bin/noir-display-menu" "$user_home/.local/bin/noir-display-profile" "$user_home/.local/bin/noir-screenshot"

if [[ -x "$user_home/.local/bin/noir-astal-install" ]]; then
    "$user_home/.local/bin/noir-astal-install"
fi
if [[ -x "$user_home/.local/bin/noir-astal-check" ]]; then
    "$user_home/.local/bin/noir-astal-check"
else
    echo "Astal checker installed; run noir-astal-check after installing AGS/Astal."
fi

if command -v ags >/dev/null 2>&1 && [[ -n "${WAYLAND_DISPLAY:-}" ]]; then
    astal_log_dir="${XDG_STATE_HOME:-$user_home/.local/state}/noir-rice"
    mkdir -p "$astal_log_dir"
    ags quit --instance ags >/dev/null 2>&1 || true
    nohup ags run "$user_home/.config/astal/app.tsx" >"$astal_log_dir/astal.log" 2>&1 </dev/null &
    astal_pid=$!
    sleep 2
    if kill -0 "$astal_pid" 2>/dev/null; then
        echo "Astal shell started (log: $astal_log_dir/astal.log)."
    else
        echo "Astal shell exited during startup. Recent log output:"
        tail -n 40 "$astal_log_dir/astal.log"
    fi
else
    echo "Astal shell will start when you next log into Niri."
fi

echo "Noir Niri rice installed. Backups: $backup_root"
echo "Log out and select Niri from your display manager, or restart Niri from an existing session."
