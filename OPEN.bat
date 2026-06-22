@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Open Global Pulse

set "URL="
if exist preview-url.txt (
  set /p URL=<preview-url.txt
)

if not defined URL set "URL=http://127.0.0.1:8888/index.html"

echo.
echo  Opening: %URL%
echo  If the page fails to load, run START.bat first and keep that window open.
echo.

start "" "%URL%"
