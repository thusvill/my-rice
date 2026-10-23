import { createState } from "ags";

export type PopupName = "audio" | "network" | "display" | "bluetooth" |
  "media" | "notifications" | "system" | "quick" | "calendar";

const [activePopup, setActivePopup] = createState<PopupName | null>(null);

export const PopupManager = {
  activePopup,
  toggle(name: PopupName) {
    setActivePopup(activePopup() === name ? null : name);
  },
  close() { setActivePopup(null); },
};
