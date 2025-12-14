@echo off
chcp 65001 >nul
title Brain Signal Analyzer - Build Tool

echo ╔════════════════════════════════════════════════════════════════╗
echo ║                🧠 Brain Signal Analyzer                        ║
echo ║                    Build Tool v1.0                             ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo [1/3] نصب پکیج‌های Python...
echo ─────────────────────────────────────────────────────────────────
pip install customtkinter numpy scipy matplotlib pillow requests pyinstaller
if errorlevel 1 (
    echo ❌ خطا در نصب پکیج‌ها!
    pause
    exit /b 1
)
echo ✅ پکیج‌ها با موفقیت نصب شدند.
echo.

echo [2/3] ساخت فایل EXE...
echo ─────────────────────────────────────────────────────────────────
pyinstaller --onefile --windowed --collect-all customtkinter --name="BrainSignalAnalyzer" brain_signal_app.py
if errorlevel 1 (
    echo ❌ خطا در ساخت EXE!
    pause
    exit /b 1
)
echo ✅ فایل EXE با موفقیت ساخته شد.
echo.

echo [3/3] پاکسازی فایل‌های موقت...
echo ─────────────────────────────────────────────────────────────────
rmdir /s /q build 2>nul
del BrainSignalAnalyzer.spec 2>nul
echo ✅ پاکسازی انجام شد.
echo.

echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    ✨ ساخت کامل شد! ✨                        ║
echo ╠════════════════════════════════════════════════════════════════╣
echo ║  فایل EXE در پوشه dist قرار دارد:                            ║
echo ║  dist\BrainSignalAnalyzer.exe                                  ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

set /p choice="آیا می‌خواهید برنامه را الان اجرا کنید؟ (y/n): "
if /i "%choice%"=="y" (
    start "" "dist\BrainSignalAnalyzer.exe"
)

pause
