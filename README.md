# Noir Niri Rice

A lightweight black-and-grayscale Niri setup using Waybar, Kitty, Fish, Fuzzel, Swaylock, Wlogout, Dunst, and YAD. It does not use Quickshell.

## Apply

```sh
cd ~/Documents/noir-rice
./apply.sh
```

Existing files are backed up under `~/.local/state/noir-rice/backups/` before copying. Log out and select Niri from the display manager after applying.

To reload the applied Niri configuration in the current session, run `niri msg action load-config-file`. This reloads the active config; do not pass the config path as a positional argument.

## Keybindings

- `Super+T`: Kitty terminal
- `Super+D`: Fuzzel application launcher
- `Super+Escape`: Wlogout
- `Super+Ctrl+L`: Swaylock
- `Super+W`: Brave
- `Super+E`: Nautilus
- `Super+S`: Noir settings GUI
- `Super/Command+P`: Noir display menu
- `Super/Command+Shift+W`: wallpaper selector
- `Super/Command+Ctrl+W`: random wallpaper
- `Super+1` through `Super+9`: workspaces
- `Super+Arrow` or `Super+H/J/K/L`: focus
- `Super+Shift+Arrow` or `Super+Shift+H/J/K/L`: move windows
- `Super+Shift+S`: screenshot selection

## Wallpaper tools

The selector uses `~/Pictures/Wallpapers`. The current wallpaper is stored in `~/.cache/noir-rice/current-wallpaper`.

`noir-wallpaper ascii [image]` creates an ASCII-rendered PNG when `chafa` and ImageMagick are installed. `jp2a` or `ascii-image-converter` can be used for alternate text previews. On X11, use `feh --bg-fill <image>` instead of `swaybg`.

## Settings GUI

`noir-settings` is also available from the Waybar gear button. It is a native GTK control center inspired by the reference app, with a dark sidebar and pages for ASCII Wallpaper, Status Bar, Displays, Window Manager, and Presets & Dotfiles. Settings preview live with debounced updates: Waybar fields reload Waybar, Niri layout fields reload Niri, lock-screen fields save immediately, and ASCII source/size changes refresh the preview. The Status Bar page exposes the complete Noir Waybar palette, workspace/module states, borders, opacity, and compositor blur with native color pickers. The Lock Screen page exposes all Swaylock color states. Waybar displays compact live CPU and memory usage stats. The Window Manager page applies Niri layout fields directly. The separate native `noir-display-menu` provides live output cards and Primary only, Secondary only, Mirror, and Extend actions. Mirror mode uses `wl-mirror`, because Niri does not provide native output mirroring.

LazyVim integration is included under `config/nvim`: the self-contained `noir` colorscheme is selected by `lua/plugins/noir.lua` and matches the Kitty, Waybar, Niri, and Swaylock palette. It does not add an external theme dependency. Display profile choices are saved in `~/.config/noir-rice/display.json`; on startup, the internal display is used alone when no external monitor is connected, otherwise the saved profile is restored.

The settings control center also includes searchable modules, diagnostics, live Kitty controls and terminal preview, Neovim theme controls, complete Waybar palette controls and visual previews, all Swaylock color states, blurred wallpaper lock-screen clock controls, disk usage, wallpaper favorites, and slideshow controls.

## Dependencies

Required: `niri`, `waybar`, `kitty`, `fish`, `fuzzel`, `swaybg`, `swaylock`, `wlogout`, `dunst`, `yad`, `jq`, `grim`, `brightnessctl`, and `playerctl`.

Optional: `nwg-displays` for fine-grained display configuration, `wl-mirror` for mirroring, `curl` for weather, `nmcli` or `nmtui` for network actions, `pavucontrol` for audio, `blueman-manager` for Bluetooth, `chafa` and ImageMagick for ASCII wallpaper generation, and `slurp` for region screenshots.
