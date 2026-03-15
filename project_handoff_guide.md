# Kairos Bible App - Project Handoff Guide

This document serves as a comprehensive knowledge base and direction for future Antigravity agents or developers working on the Kairos Bible App. It captures the architectural philosophy, user preferences, current state, and critical "gotchas" discovered during development.

---

## 🏛️ Project Philosophy & "Kairos" Definition

### What is a "Kairos"?
A **Kairos** is not just a timer for reading a chapter. It is defined as a **curated "playlist" or "bible video" experience**. 
- It can include sequential chapters, non-sequential passages from different books, or specific segments (e.g., John 1:1-18 followed by Psalm 23).
- The goal is a seamless, distraction-free flow through Scripture.

### Core Ethos: "No Pressure, Just Progress"
- The app should feel premium and encouraging.
- Avoid "guilt-tripping" the user. Instead of showing "0 minutes done," show "Ready for your first session."
- Emphasize consistency over perfection.

---

## 🎨 Design & Aesthetics (Premium Standard)

- **Color Palette**: 
  - Background: Sleek Dark Mode (`#131316`).
  - Accent: Gold (`#C9A84C`) used for progress, "Bonus Time," and active verses.
  - Text: Warm Off-White (`#F0EBE1`) for readability.
- **Typography**: 
  - Serif (`Lora`) for Scripture and headings to give a premium, classic feel.
  - Sans-serif (`DM Sans`) for UI elements and labels.
- **Visual Cues**: 
  - Progress bars should be subtle but gold.
  - Use glassmorphism and subtle micro-animations (e.g., the `.pg.animate` class).
  - Cards on the home screen should look dynamic (e.g., the Daily Kairos card includes a faded verse snippet background).

---

## 🛠️ Technical Architecture

### Component Structure
Currently, the app resides primarily in `kairos-app 1.2.jsx`. 
- **CRITICAL**: This file is large (~1200+ lines). A high-priority future task is **modularization** (extracting `TimerBar`, `NotePopup`, and major tabs into separate files).

### State Management
- **Persistence**: All user data (mins, mode, highlights, notes, stats) is persisted in `localStorage` under the key `kairos_data`.
- **Syncing Hooks**: Ensure the "Save" effect in `useEffect` covers all critical state variables to prevent data loss.

### Timer & "Bonus Time" Logic
- **Goal Tracking**: The timer tracks `elapsed` vs `total` (derived from `mins`).
- **Bonus Time**: When `elapsed >= total`, the UI switches to "Bonus Time."
  - The progress bar is hidden.
  - Labels turn gold.
  - The running clock continues counting UP indefinitely.
- **Extend Goal**: While in bonus time, users can add +5, +10, or +15 minutes. This updates the `mins` state, causing the app to transition back from bonus time to goal-tracking mode (restoring the progress bar).

---

## 📖 Feature Implementation Details

### Bible Reader
- **Data Source**: Bible text is fetched from `/data/verses-1769.json`.
- **Narration (TTS)**: Uses the **Web Speech API**. 
  - Syncing: The reader highlights the current verse and "glides" (auto-scrolling) to keep the active verse centered.
  - Playback: Advancement through the `SESS_PLAYLIST` is automatic when a passage ends.

### Post-Timer Options
- When a user finishes a Kairos or clicks "Complete":
  - If the timer is still running, it prompts: *"You still have some time left. Would you like to end early or keep reading and maybe reread or review?"*
  - The app should encourage fulfilling the "Kairos time."

### Stats & History
- Stats track total seconds, seconds per book, and seconds per testament.
- History is a simple array of ISO date strings (e.g., `["2025-03-12", "2025-03-13"]`) used for the 7-day activity grid.

---

## ⚠️ Critical "Gotchas" & Debugging Notes

- **React Hook Violations**: 
  - Be extremely careful with conditional returns before hooks. The `boarded` check must come *after* all `useState`, `useEffect`, `useRef`, and `useMemo` declarations.
  - **Hook Sanitization**: Derived objects (`readerPass`, `safeStats`) should be wrapped in `useMemo` to ensure stable references and avoid infinite re-render loops or "Hook size changed" errors.
- **TTS Reset**: Always `window.speechSynthesis.cancel()` when switching chapters or stopping playback to prevent overlapping narration.

---

## 🚀 Future Roadmap Recommendations

1. **Modularization**: Break down `kairos-app 1.2.jsx` into a `/components` directory.
2. **Custom Kairos Builder**: Build a UI for users to create their own "playlists" of verses.
3. **Soundscapes**: Add ambient background sounds (rain, soft drones) that play during reading.
4. **Enhanced Stats**: Provide deeper insights into reading rhythms and book completion percentages.

---
*Created by Antigravity - Last updated March 14, 2026*
