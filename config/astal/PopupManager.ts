import { createState } from "ags";

export type PopupName = "audio" | "network" | "display" | "bluetooth" |
  "media" | "notifications" | "system" | "quick" | "calendar";

/** Which edge the popup should align to on the bar */
export type PopupAnchorSide = "left" | "center" | "right";

const [activePopup, setActivePopup] = createState<PopupName | null>(null);
const [popupAnchor, setPopupAnchor] = createState<PopupAnchorSide>("right");

export const PopupManager = {
  activePopup,
  popupAnchor,
  toggle(name: PopupName, anchor: PopupAnchorSide = "right") {
    if (activePopup() === name) {
      setActivePopup(null);
    } else {
      setPopupAnchor(anchor);
      setActivePopup(name);
    }
  },
  close() { setActivePopup(null); },
};
