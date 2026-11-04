@echo off
rem Fast relay for the HSL IT Tracker (Windows): reads NSE's announcement RSS feeds and BSE's announcement list every
rem few seconds and sends each new filing to the tracker. Keep this window open during market hours.
rem Needs Node.js 18 or later (https://nodejs.org). The key is the tracker's admin password, or RELAY_KEY if one is set on Render.
cd /d "%~dp0"
if "%RELAY_KEY%"=="" set /p RELAY_KEY=Tracker admin password: 
if "%EVERY%"=="" set EVERY=5
node relay.mjs --out "%TEMP%\nse-relay-latest.json" --loop %EVERY% --post https://bse-it-tracker.onrender.com/api/nse-relay
pause
