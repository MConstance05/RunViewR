@echo off
cd /d "%~dp0"
set PORT=8000
start "" http://localhost:%PORT%/RunViewR.html
py server.py
pause
