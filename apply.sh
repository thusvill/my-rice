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
    backup_and_copy "$source" "$user_home/.local/bin/$name"
    chmod 755 "$user_home/.local/bin/$name"
done < <(find "$package_dir/bin" -maxdepth 1 -type f -print0)

chmod 755 "$user_home/.local/bin/noir-settings" "$user_home/.local/bin/noir-wallpaper" "$user_home/.local/bin/noir-lockscreen" "$user_home/.local/bin/noir-backup" "$user_home/.local/bin/noir-notifications" "$user_home/.local/bin/noir-weather"
chmod 755 "$user_home/.local/bin/noir-display-menu" "$user_home/.local/bin/noir-display-profile"

echo "Noir Niri rice installed. Backups: $backup_root"
echo "Log out and select Niri from your display manager, or restart Niri from an existing session."
