import { execAsync } from "ags/process";
import GLib from "gi://GLib";

export const run = (command: string[]) => execAsync(command).catch(() => "");

export const command = (name: string, ...args: string[]) =>
  run([name, ...args]);

export const helper = (name: string, ...args: string[]) =>
  command(`${GLib.getenv("HOME")}/.local/bin/${name}`, ...args);

// Kept in one place so service failures never take down the shell.
