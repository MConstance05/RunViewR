# RunViewR local project

This version is meant to live in one folder on your PC so you do not need to keep reinstalling a zip or manually exchanging Strava codes in PowerShell.

## One-time setup

1. Extract this folder somewhere permanent, for example `C:\Users\thema\RunViewR-dev`
2. Copy `.env.example` to `.env`
3. Put your Strava app values in `.env`:
   - `STRAVA_CLIENT_ID`
   - `STRAVA_CLIENT_SECRET`
4. Double-click `start-runviewr.bat`

## Daily use

- Double-click `start-runviewr.bat`
- Open Settings in RunViewR
- Click **Connect with Strava** once
- After that, RunViewR stores the refresh token locally in `tokens.json` and refreshes access tokens automatically

## Future changes

Keep this folder. Future edits can be applied directly to files in this folder instead of replacing the whole app.

## Security note

`tokens.json` contains your local Strava tokens. Keep this folder private.
