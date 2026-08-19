---
name: ADBScope
description: Instrument-panel UI for a native Windows Android debugging desk
colors:
  void: "#0a0d10"
  panel: "#12161b"
  panel-raised: "#181d24"
  panel-sunken: "#0d1116"
  hairline: "#262d36"
  hairline-strong: "#333c47"
  ink: "#e8ecf1"
  ink-muted: "#9aa5b1"
  ink-faint: "#5b6572"
  online: "#3ddc84"
  warning: "#ffb020"
  fault: "#ff5470"
  live: "#22d3ee"
typography:
  ui:
    fontFamily: "'IBM Plex Sans Variable', 'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif"
    fontWeight: 400
  data:
    fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', 'Cascadia Mono', Consolas, monospace"
    fontWeight: 400
rounded:
  sm: "3px"
  md: "4px"
spacing:
  unit: "8px"
components:
  tile:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
  tile-header-label:
    textColor: "{colors.ink-muted}"
  button-primary:
    backgroundColor: "{colors.live}"
    textColor: "{colors.void}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  status-led-online:
    backgroundColor: "{colors.online}"
  status-led-fault:
    backgroundColor: "{colors.fault}"
---

# Design System: ADBScope

## Overview

**Creative North Star: "The Operations Deck"**

ADBScope reads as a control-room instrumentation wallboard for a fleet of Android devices, not a SaaS admin dashboard. The world is the one a systems engineer already trusts at 3am: a rack of status tiles, sparklines instead of chart-junk, numeric readouts in a real monospace, and color that means exactly one thing — device state — and nothing else. Sidebar devices are channel tiles in a rack, not a nav list. Overview is a grid of instrument modules snapped to a strict grid. Logcat is a telemetry event feed. The screen mirror is a monitor tile with an OSD status strip along its edge. The shell is a console tile in the same grammar as everything around it, not a bolted-on xterm widget.

Ground is dark by default — an ops room runs the lights low so the boards read clean, and this is also the correct condition for judging device screen color and for marathon logcat sessions. Depth comes from three panel tones and 1px hairline borders, never soft drop shadows: this is a machined, screwed-together instrument, not a stack of floating cards. Corners are barely rounded (3–4px) — machined edges, not bubble UI.

**Key Characteristics:**
- Dark control-room ground by default; a fully-realized light "daylight ops room" variant carries the same grammar inverted — the light/dark/system toggle is preserved, not removed.
- Color is reserved for state only: online/nominal green, warning/reconnecting amber, fault/offline red, live/focused-channel cyan. Nothing decorative ever uses these four hues.
- Two typefaces, both technical: IBM Plex Sans for UI chrome and labels, JetBrains Mono for every number, log line, device ID, and terminal.
- No drop shadows. Depth = panel-tone steps (void → panel → panel-raised) + hairline borders + a subtle inset well on sunken surfaces.
- Everything snaps to an 8px module grid. Tiles carry a small tracked-caps label row over a large tabular-mono readout, like a real instrument.

## Colors

Dark is the primary/home rendition. Light is a fully-designed daylight variant of the same grammar, not an afterthought.

### Primary
- **Live Cyan** (`#22d3ee` dark / `#0891b2` light): the one interactive/focus accent — selected device rail, active tab underline, primary buttons, "live" pulse on an active session. Never used for anything ambient.

### Neutral (panel steel)
- **Void** (`#0a0d10` dark / `#eef1f4` light): the page ground behind every tile.
- **Panel** (`#12161b` dark / `#ffffff` light): the resting surface of every tile, card, and control.
- **Panel Raised** (`#181d24` dark / `#f7f9fb` light): hover/active tile surface, nested panels.
- **Panel Sunken** (`#0d1116` dark / `#e7ebef` light): inputs, wells, the terminal viewport background.
- **Hairline** (`#262d36` dark / `#d7dde3` light): default border between every tile and control.
- **Hairline Strong** (`#333c47` dark / `#b9c2cb` light): emphasized dividers, focused tile outline.
- **Ink** (`#e8ecf1` dark / `#12161b` light): primary text and numeric readouts.
- **Ink Muted** (`#9aa5b1` dark / `#4b5563` light): labels, captions, tracked small caps.
- **Ink Faint** (`#5b6572` dark / `#8994a1` light): disabled state, verbose log lines, placeholder text.

### Named Rules
**The State-Only Rule.** Green, amber, red, and cyan mean device/session state and nothing else. A chart, an icon, or a decorative accent never borrows them. If a value needs color and isn't a state, it stays neutral.

## Typography

**UI Font:** IBM Plex Sans (variable, with system-ui fallback)
**Data/Mono Font:** JetBrains Mono (variable, with Cascadia Mono/Consolas fallback)

**Character:** IBM Plex Sans is a technical, engineering-drawn grotesk — built for IBM's own instrumentation and documentation, not a decorative pairing. JetBrains Mono carries every number, identifier, and log line so data always reads as data, distinct from chrome.

### Hierarchy
- **Readout** (600, 22–28px tabular-nums, mono): the one big number on an instrument tile — battery %, storage %, uptime.
- **Title** (600, 15px, sans): device name, panel titles.
- **Body** (400, 13px, sans): descriptions, dialog copy.
- **Label** (500, 11px, sans, uppercase, tracking 0.06em): tile header labels, section headers, table column heads.
- **Data** (400, 12–13px, mono): log lines, serials, build fingerprints, terminal content, IDs.

### Named Rules
**The Two-Voice Rule.** Sans is chrome and prose; mono is anything that is, or looks like, a machine-produced value. Never render a device name in mono or a log line in sans.

## Layout

8px base module. Every tile, gap, and control height is a multiple of 8 (buttons/inputs 32px tall, tile padding 16px, tile gaps 8–16px). The device sidebar is a fixed-width vertical rack (240–280px) of channel tiles. The workspace content area is either a snapped instrument-tile grid (Overview) or a single full-bleed framed tile (Screen, Shell). Logcat is a full-width telemetry strip docked to the bottom, resizable. No responsive breakpoints — this is a fixed-chrome desktop window; layout adapts to the resizable panel widths only.

## Elevation & Depth

Flat by design — no `box-shadow` anywhere except a 1px inset on sunken wells (inputs, terminal viewport) to read as "recessed into the panel." Depth comes entirely from the panel-tone ladder (void < panel < panel-raised) and 1px hairline borders. A hover state raises panel → panel-raised; it never adds a shadow.

## Shapes

Machined corners: 3px on controls (buttons, inputs, badges), 4px on tiles/cards/dialogs. Nothing is fully rounded except the status LED dot itself. Borders are always 1px hairline; a focused/active element gets `hairline-strong` plus a 1px live-cyan inset ring, never a glow.

## Components

### Buttons
- **Shape:** 3px radius, 1px hairline border on secondary/outline variants.
- **Primary:** live-cyan background, void-colored text, used sparingly (one primary action per view).
- **Secondary/Ghost:** panel-raised on hover, hairline border, ink-muted → ink text on hover.
- **Destructive:** fault-red text/border, fills solid only on confirm.

### Tiles (Cards)
- **Corner:** 4px.
- **Background:** panel, panel-raised on hover when interactive.
- **Border:** 1px hairline.
- **Header:** small tracked-caps label row (ink-muted) above a mono readout (ink), icon at label size.
- **Shadow:** none.

### Inputs / Fields
- **Style:** panel-sunken background, 1px hairline border, 3px radius.
- **Focus:** border → live-cyan, no glow/ring blur.
- **Mono fields** (search, IDs): JetBrains Mono.

### Status LED
- **Shape:** 6–8px filled circle, the only fully-rounded shape in the system.
- **States:** online (green, soft pulse animation while live), offline (ink-faint, static), warning/reconnecting (amber, blink), fault (red, static).

### Device Rack Tile (Signature Component)
Sidebar entries are channel-strip tiles, not list rows: status LED + device name (sans, 13px) on the label line, transport badge (mono, 10px, uppercase) + serial (mono, ink-faint) on the data line, 1px hairline separating tiles, selected tile gets a 2px live-cyan left rail plus panel-raised background.

### Navigation (Workspace Tabs)
Segmented panel-selector, not underlined browser tabs: a single hairline-bordered strip, each tab a flat segment, active segment = panel-raised background + live-cyan 2px bottom rail. Mono uppercase 11px labels with 0.06em tracking.

## Do's and Don'ts

### Do:
- **Do** keep color meaning state only — the State-Only Rule.
- **Do** render every numeric readout, ID, and log line in JetBrains Mono, tabular-nums where the value updates live.
- **Do** use 1px hairlines and panel-tone steps for all depth; keep the light theme a full parallel rendition, not a color-inverted afterthought.
- **Do** keep the scrcpy mirror tile's visibility-toggle mechanism (hides on `data-scroll-locked`) — it is load-bearing, not a styling choice.

### Don't:
- **Don't** add drop shadows, gradients, or glass/blur effects anywhere — this world is flat and machined.
- **Don't** use full pill/rounded-full shapes except the status LED dot.
- **Don't** let a generic shadcn gray (`oklch(0.97 0 0)` style neutrals) or the default Inter/system-ui stack leak back in — every neutral routes through the panel-steel ramp above.
- **Don't** rename, relogo, or drop the ES/EN bilingual toggle — both are fixed brand commitments.
