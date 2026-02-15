# AI Anchor Demo

A browser app that turns text into speech and animates an on-screen anchor in real time.

## Features

- Text-to-speech narration using the Web Speech API.
- Improved anchor design (hair, eyebrows, eyes, nose, blazer, and depth lighting).
- Smoother lip-sync motion with interpolation and phoneme-weighted mouth openness.
- Blink animation and subtle head bob for more lifelike delivery.
- Fallback mouth timing for browsers that do not emit speech boundary events.

## Run locally

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.
