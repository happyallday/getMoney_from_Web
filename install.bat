@echo off
chcp 65001 >nul
echo ========================================
echo   Welfare Helper - Browser Extension
echo   Installation Program v0.1.0
echo ========================================
echo.

:: Check Python environment
echo [1/5] Checking Python environment...
python --version >nul 2>&1
if errorlevel 1 (
    echo   [ERROR] Python not detected, please install Python 3.10+
    pause
    exit /b 1
)
echo   [OK] Python environment check passed

:: Check pip
echo.
echo [2/5] Checking pip environment...
pip --version >nul 2>&1
if errorlevel 1 (
    echo   [ERROR] pip not detected, please check Python installation
    pause
    exit /b 1
)
echo   [OK] pip environment check passed

:: Create virtual environment
echo.
echo [3/5] Creating Python virtual environment...
if not exist venv (
    python -m venv venv
    echo   [OK] Virtual environment created successfully
) else (
    echo   [INFO] Virtual environment already exists, skipping creation
)

:: Activate virtual environment and install dependencies
echo.
echo [4/5] Installing Python dependency packages...
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo   [ERROR] Dependency package installation failed
    pause
    exit /b 1
)
echo   [OK] Dependency packages installed successfully

:: Initialize database
echo.
echo [5/5] Initializing database...
mkdir database 2>nul
python -c "import sqlite3; conn = sqlite3.connect('database/welfare_helper.db'); conn.executescript(open('database/schema.sql', 'r', encoding='utf-8').read()); conn.commit(); conn.close()"
if errorlevel 1 (
    echo   [ERROR] Database initialization failed
    pause
    exit /b 1
)
echo   [OK] Database initialization completed

:: Install system service
echo.
echo ========================================
echo  Install System Service
echo ========================================
choice /C YN /M "Install as system service (auto-start on boot)?"
if errorlevel 2 goto :skip_service
if errorlevel 1 goto :install_service

:install_service
echo Installing system service...
python python-backend/service_manager.py install 2>nul
if errorlevel 1 (
    echo   [WARNING] System service installation failed, you can run backend service manually
) else (
    echo   [OK] System service installed successfully
    echo   Start service: net start WelfareHelper
)
goto :service_done

:skip_service
echo   [SKIP] System service installation skipped

:service_done

:: Browser extension installation guide
echo.
echo ========================================
echo  Browser Extension Installation
echo ========================================
echo Please follow these steps to install the browser extension:
echo.
echo 1. Open Chrome/Edge browser
echo 2. Visit: chrome://extensions/
echo 3. Enable "Developer mode"
echo 4. Click "Load unpacked extension program"
echo 5. Select the browser-extension folder in this directory
echo.
echo After installation, the Welfare Helper icon will appear in the browser address bar
echo.

:: Create desktop shortcut
echo Creating desktop shortcut...
set "shortcut_target=%CD%\browser-extension"
set "shortcut_name=WelfareHelper"
powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%USERPROFILE%\Desktop\%shortcut_name%.url');$s.TargetPath='%CD%';$s.Save()"
echo   [OK] Desktop shortcut created successfully

:: Installation complete
echo.
echo ========================================
echo  Installation Complete!
echo ========================================
echo.
echo Backend service operation instructions:
echo   - Start service:   python python-backend/main.py
echo   - Or use service:  net start WelfareHelper
echo   - Stop service:    net stop WelfareHelper
echo.
echo Configuration file location:
echo   - User configuration:   database/welfare_helper.db
echo   - Extension config:     browser-extension/popup/
echo.
echo Documentation location:
echo   - User guide:      docs/USER_GUIDE.md
echo   - Installation:    docs/INSTALL.md
echo.
echo ========================================
echo.

choice /C YN /M "Start backend service immediately?"
if errorlevel 2 goto :end
if errorlevel 1 goto :start_service

:start_service
echo Starting backend service...
start python python-backend/main.py
echo   [OK] Backend service started
echo Please ensure browser extension is properly installed
echo.

:end
echo Thank you for using Welfare Helper!
echo.
pause