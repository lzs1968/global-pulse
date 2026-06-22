@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Global Pulse Preview

echo.
echo  ========================================
echo   Global Pulse 本地预览
echo  ========================================
echo.
echo  正在启动（无需 Python）...
echo  请用 Chrome 或 Edge 打开终端里显示的绿色地址
echo  若已启动过服务，可双击 OPEN.bat 重新打开浏览器
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"

echo.
echo  服务已停止。地址曾保存在 preview-url.txt
pause
