@echo off
REM Multilingual Chatbot Training Script for Windows
REM This script trains all 8 language-specific models

setlocal enabledelayedexpansion

cls
echo.
echo ============================================================
echo  MULTILINGUAL CHATBOT v2.0 - MODEL TRAINING
echo ============================================================
echo.

REM Check Python
echo [1/3] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.7+
    pause
    exit /b 1
)
python --version
echo.

REM Install dependencies
echo [2/3] Installing dependencies...
echo Installing: sentence-transformers, scikit-learn, numpy, torch
pip install -r requirements.txt >nul 2>&1
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo Done!
echo.

REM Train models
echo [3/3] Training language-specific models...
echo This will take 5-10 minutes. Please wait...
echo.

python scripts\train_multilingual.py

if errorlevel 1 (
    echo.
    echo ERROR: Training failed!
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  TRAINING COMPLETE!
echo ============================================================
echo.
echo Next steps:
echo 1. Update backend: backend\routes\chatbot.js
echo    Change line 112 to: '../MULTILINGUAL_CHATBOT/scripts/chatbot_multilingual.py'
echo.
echo 2. Restart backend:
echo    cd backend
echo    npm restart
echo.
echo 3. Test chatbot:
echo    - Select Spanish
echo    - Ask: "¿Dónde se encuentra Naujan?"
echo    - Should respond in Spanish!
echo.
echo Documentation:
echo - README.md          - Full documentation
echo - QUICK_START.md     - Fast setup
echo - MIGRATION_GUIDE.md - Migration from v1.0
echo.
pause
