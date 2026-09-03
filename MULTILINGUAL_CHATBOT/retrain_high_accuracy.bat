@echo off
echo ========================================
echo HIGH ACCURACY RETRAINING
echo ========================================
echo.

cd /d "%~dp0"

echo Running high accuracy retraining...
python retrain_high_accuracy.py

echo.
echo ========================================
echo RETRAINING COMPLETE
echo ========================================
pause
