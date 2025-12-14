@echo off
chcp 65001 >nul
title Brain Signal Analyzer

echo ╔════════════════════════════════════════════════════════════════╗
echo ║                🧠 Brain Signal Analyzer                        ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo بررسی و نصب پکیج‌ها...
pip install -q customtkinter numpy scipy matplotlib pillow requests

echo اجرای برنامه...
python brain_signal_app.py

pause
