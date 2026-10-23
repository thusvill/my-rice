# Noir Astal shell

This directory is the active bar and popup implementation for Noir. It is
loaded by AGS v3 with `ags run app.tsx`; the old `config/waybar` directory is
kept as rollback material only.

The shell deliberately degrades when an optional Astal service is unavailable.
The buttons still expose the existing Noir helpers for display profiles,
screenshots, locking, and power actions.
