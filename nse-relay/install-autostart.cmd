@echo off
rem Starts the fast relay automatically, minimised, every time this Windows user signs in (and now).
rem Run once. The key (the tracker's admin password, or RELAY_KEY if one is set on Render) is saved for this Windows user.
rem To stop it for good: delete hsl-nse-relay.cmd from the Startup folder (Win+R, shell:startup).
cd /d "%~dp0"
if "%RELAY_KEY%"=="" set /p RELAY_KEY=Tracker admin password: 
setx RELAY_KEY "%RELAY_KEY%" >nul
> "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\hsl-nse-relay.cmd" echo @start "HSL NSE relay" /min cmd /c "%~dp0run-fast.cmd"
echo Installed: the relay now starts by itself whenever you sign in to Windows. Starting it...
start "HSL NSE relay" /min cmd /c "%~dp0run-fast.cmd"
